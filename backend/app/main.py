"""FastAPI entry: REST helpers + WebSocket game channel."""

from __future__ import annotations

import asyncio
import json
from typing import Any

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from . import ai as ai_mod
from . import config
from .room import RoomManager, private_state, public_state

app = FastAPI(title="Avalon Online")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = RoomManager()
# room_id -> player_id -> websocket
connections: dict[str, dict[str, WebSocket]] = {}
_bot_tasks: dict[str, asyncio.Task[None]] = {}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/meta")
def meta() -> dict[str, Any]:
    return {
        "defaultRoles": config.DEFAULT_ROLES,
        "questSizes": config.QUEST_TEAM_SIZES,
        "goodEvil": config.GOOD_EVIL_COUNT,
        "roleLabels": config.ROLE_LABELS_ZH,
        "allRoles": sorted(config.GOOD_ROLES | config.EVIL_ROLES),
    }


async def send_json(ws: WebSocket, payload: dict[str, Any]) -> None:
    await ws.send_text(json.dumps(payload, ensure_ascii=False))


async def push_room(room_id: str) -> None:
    room = manager.rooms.get(room_id)
    if not room:
        return
    pub = public_state(room)
    for pid, ws in list(connections.get(room_id, {}).items()):
        player = room.players.get(pid)
        if not player or player.is_ai:
            continue
        try:
            await send_json(
                ws,
                {
                    "type": "state",
                    "public": pub,
                    "private": private_state(room, player),
                },
            )
        except Exception:
            player.connected = False


async def error(ws: WebSocket, message: str) -> None:
    await send_json(ws, {"type": "error", "message": message})


async def run_bots_loop(room_id: str) -> None:
    """Drive AI actions with short delays until humans must act or game ends."""
    try:
        # Cap iterations to avoid runaway loops
        for _ in range(80):
            room = manager.rooms.get(room_id)
            if not room:
                return
            if not any(p.is_ai for p in room.players.values()):
                return
            if room.phase.value in ("lobby", "ended"):
                return
            changed = ai_mod.step_bots(manager, room)
            if not changed:
                return
            await push_room(room_id)
            await asyncio.sleep(0.55)
    finally:
        _bot_tasks.pop(room_id, None)


def schedule_bots(room_id: str) -> None:
    existing = _bot_tasks.get(room_id)
    if existing and not existing.done():
        return
    _bot_tasks[room_id] = asyncio.create_task(run_bots_loop(room_id))


async def after_change(room_id: str) -> None:
    await push_room(room_id)
    schedule_bots(room_id)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    room_id: str | None = None
    player_id: str | None = None
    try:
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await error(ws, "无效消息")
                continue
            action = msg.get("action")
            try:
                if action == "create":
                    room, player = manager.create_room(
                        msg.get("name", "房主"),
                        int(msg.get("targetPlayers", 5)),
                    )
                    room_id, player_id = room.room_id, player.player_id
                    connections.setdefault(room_id, {})[player_id] = ws
                    await after_change(room_id)

                elif action == "join":
                    room, player = manager.join_room(msg.get("roomId", ""), msg.get("name", "玩家"))
                    room_id, player_id = room.room_id, player.player_id
                    connections.setdefault(room_id, {})[player_id] = ws
                    await after_change(room_id)

                elif action == "reconnect":
                    room, player = manager.reconnect(msg.get("roomId", ""), msg.get("playerId", ""))
                    room_id, player_id = room.room_id, player.player_id
                    connections.setdefault(room_id, {})[player_id] = ws
                    await after_change(room_id)

                elif action == "configure":
                    if not room_id or not player_id:
                        raise ValueError("未入房")
                    room = manager.rooms[room_id]
                    manager.set_config(
                        room,
                        player_id,
                        target_players=msg.get("targetPlayers"),
                        custom_roles=msg.get("customRoles"),
                        clear_custom=bool(msg.get("clearCustom")),
                    )
                    await after_change(room_id)

                elif action == "fill_bots":
                    if not room_id or not player_id:
                        raise ValueError("未入房")
                    manager.add_bots(manager.rooms[room_id], player_id, msg.get("count"))
                    await after_change(room_id)

                elif action == "clear_bots":
                    if not room_id or not player_id:
                        raise ValueError("未入房")
                    manager.remove_bots(manager.rooms[room_id], player_id)
                    await after_change(room_id)

                elif action == "start":
                    if not room_id or not player_id:
                        raise ValueError("未入房")
                    manager.start_game(manager.rooms[room_id], player_id)
                    await after_change(room_id)

                elif action == "ack_role":
                    if not room_id or not player_id:
                        raise ValueError("未入房")
                    manager.ack_role(manager.rooms[room_id], player_id)
                    await after_change(room_id)

                elif action == "propose_team":
                    if not room_id or not player_id:
                        raise ValueError("未入房")
                    manager.propose_team(manager.rooms[room_id], player_id, list(msg.get("team", [])))
                    await after_change(room_id)

                elif action == "team_vote":
                    if not room_id or not player_id:
                        raise ValueError("未入房")
                    manager.cast_team_vote(
                        manager.rooms[room_id], player_id, bool(msg.get("approve"))
                    )
                    await after_change(room_id)

                elif action == "quest_card":
                    if not room_id or not player_id:
                        raise ValueError("未入房")
                    manager.play_quest_card(
                        manager.rooms[room_id], player_id, bool(msg.get("success"))
                    )
                    await after_change(room_id)

                elif action == "assassinate":
                    if not room_id or not player_id:
                        raise ValueError("未入房")
                    manager.assassinate(
                        manager.rooms[room_id], player_id, msg.get("targetId", "")
                    )
                    await after_change(room_id)

                elif action == "emoji":
                    if not room_id or not player_id:
                        raise ValueError("未入房")
                    room = manager.rooms[room_id]
                    name = room.players[player_id].name
                    for other_ws in connections.get(room_id, {}).values():
                        await send_json(
                            other_ws,
                            {
                                "type": "emoji",
                                "playerId": player_id,
                                "name": name,
                                "emoji": msg.get("emoji", "👍"),
                            },
                        )

                elif action == "rematch":
                    if not room_id or not player_id:
                        raise ValueError("未入房")
                    manager.rematch(manager.rooms[room_id], player_id)
                    await after_change(room_id)

                else:
                    await error(ws, f"未知动作: {action}")
            except ValueError as exc:
                await error(ws, str(exc))
            except KeyError:
                await error(ws, "房间已失效")
    except WebSocketDisconnect:
        if room_id and player_id:
            room = manager.rooms.get(room_id)
            if room and player_id in room.players:
                room.players[player_id].connected = False
            conns = connections.get(room_id, {})
            conns.pop(player_id, None)
            if room:
                await push_room(room_id)

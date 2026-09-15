"""Room state machine for Avalon."""

from __future__ import annotations

import random
import secrets
import string
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

from . import config


class Phase(str, Enum):
    LOBBY = "lobby"
    ROLE_REVEAL = "role_reveal"
    TEAM_PROPOSE = "team_propose"
    TEAM_VOTE = "team_vote"
    QUEST = "quest"
    ASSASSIN = "assassin"
    ENDED = "ended"


@dataclass
class Player:
    player_id: str
    name: str
    connected: bool = True
    role: str | None = None
    seat: int = 0
    role_acked: bool = False
    is_ai: bool = False


@dataclass
class HouseRules:
    """Optional house rules; defaults keep official play."""

    vote_timeout_sec: int = 0  # 0 = no timeout
    allow_leader_self_exclude: bool = True


@dataclass
class Room:
    room_id: str
    host_id: str
    target_players: int = 5
    custom_roles: list[str] | None = None
    house: HouseRules = field(default_factory=HouseRules)
    players: dict[str, Player] = field(default_factory=dict)
    phase: Phase = Phase.LOBBY
    leader_id: str | None = None
    quest_index: int = 0  # 0..4
    quest_results: list[bool | None] = field(default_factory=lambda: [None] * 5)
    reject_count: int = 0
    proposed_team: list[str] = field(default_factory=list)
    team_votes: dict[str, bool] = field(default_factory=dict)
    quest_cards: dict[str, bool] = field(default_factory=dict)  # True=success
    assassin_target: str | None = None
    winner: str | None = None  # "good" | "evil"
    win_reason: str | None = None
    last_vote_tally: dict[str, Any] | None = None
    last_quest_fail_count: int | None = None

    def role_list(self) -> list[str]:
        if self.custom_roles:
            return list(self.custom_roles)
        return list(config.DEFAULT_ROLES[self.target_players])

    def ordered_players(self) -> list[Player]:
        return sorted(self.players.values(), key=lambda p: p.seat)

    def next_leader(self) -> str:
        order = [p.player_id for p in self.ordered_players()]
        if not self.leader_id or self.leader_id not in order:
            return order[0]
        idx = order.index(self.leader_id)
        return order[(idx + 1) % len(order)]


class RoomManager:
    def __init__(self) -> None:
        self.rooms: dict[str, Room] = {}

    def _new_room_id(self) -> str:
        for _ in range(20):
            code = "".join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
            if code not in self.rooms:
                return code
        raise RuntimeError("无法生成房间号")

    def create_room(self, host_name: str, target_players: int = 5) -> tuple[Room, Player]:
        if target_players not in config.GOOD_EVIL_COUNT:
            raise ValueError("人数须为 5–10")
        room_id = self._new_room_id()
        host = Player(player_id=secrets.token_hex(8), name=host_name.strip() or "房主", seat=0)
        room = Room(room_id=room_id, host_id=host.player_id, target_players=target_players)
        room.players[host.player_id] = host
        self.rooms[room_id] = room
        return room, host

    def join_room(self, room_id: str, name: str) -> tuple[Room, Player]:
        room = self.rooms.get(room_id.upper())
        if not room:
            raise ValueError("房间不存在")
        if room.phase != Phase.LOBBY:
            raise ValueError("对局已开始，无法加入")
        if len(room.players) >= room.target_players:
            raise ValueError("房间已满")
        player = Player(
            player_id=secrets.token_hex(8),
            name=name.strip() or f"玩家{len(room.players) + 1}",
            seat=len(room.players),
        )
        room.players[player.player_id] = player
        return room, player

    def reconnect(self, room_id: str, player_id: str) -> tuple[Room, Player]:
        room = self.rooms.get(room_id.upper())
        if not room or player_id not in room.players:
            raise ValueError("无法重连")
        player = room.players[player_id]
        player.connected = True
        return room, player

    def set_config(
        self,
        room: Room,
        actor_id: str,
        *,
        target_players: int | None = None,
        custom_roles: list[str] | None = None,
        clear_custom: bool = False,
    ) -> None:
        if actor_id != room.host_id:
            raise ValueError("仅房主可改设置")
        if room.phase != Phase.LOBBY:
            raise ValueError("对局已开始")
        if target_players is not None:
            if target_players not in config.GOOD_EVIL_COUNT:
                raise ValueError("人数须为 5–10")
            if len(room.players) > target_players:
                raise ValueError("当前人数已超过目标人数")
            room.target_players = target_players
            room.custom_roles = None
        if clear_custom:
            room.custom_roles = None
        if custom_roles is not None:
            err = config.validate_role_list(custom_roles, room.target_players)
            if err:
                raise ValueError(err)
            room.custom_roles = custom_roles

    def start_game(self, room: Room, actor_id: str) -> None:
        if actor_id != room.host_id:
            raise ValueError("仅房主可开始")
        if len(room.players) != room.target_players:
            raise ValueError(f"需要 {room.target_players} 人齐才能开始")
        roles = room.role_list()
        err = config.validate_role_list(roles, room.target_players)
        if err:
            raise ValueError(err)
        shuffled = roles[:]
        random.shuffle(shuffled)
        for player, role in zip(room.ordered_players(), shuffled):
            player.role = role
            player.role_acked = False
        room.phase = Phase.ROLE_REVEAL
        room.quest_index = 0
        room.quest_results = [None] * 5
        room.reject_count = 0
        room.proposed_team = []
        room.team_votes = {}
        room.quest_cards = {}
        room.winner = None
        room.win_reason = None
        room.assassin_target = None
        room.last_vote_tally = None
        room.last_quest_fail_count = None
        room.leader_id = random.choice(list(room.players.keys()))

    def ack_role(self, room: Room, player_id: str) -> None:
        if room.phase != Phase.ROLE_REVEAL:
            raise ValueError("当前不是身份确认阶段")
        room.players[player_id].role_acked = True
        if all(p.role_acked for p in room.players.values()):
            room.phase = Phase.TEAM_PROPOSE

    def propose_team(self, room: Room, actor_id: str, team: list[str]) -> None:
        if room.phase != Phase.TEAM_PROPOSE:
            raise ValueError("当前不能提议队伍")
        if actor_id != room.leader_id:
            raise ValueError("只有领袖可以提议队伍")
        size = config.QUEST_TEAM_SIZES[room.target_players][room.quest_index]
        if len(team) != size:
            raise ValueError(f"本轮需要 {size} 人")
        if len(set(team)) != len(team):
            raise ValueError("队伍成员重复")
        for pid in team:
            if pid not in room.players:
                raise ValueError("无效队员")
        room.proposed_team = team
        room.team_votes = {}
        room.phase = Phase.TEAM_VOTE

    def cast_team_vote(self, room: Room, player_id: str, approve: bool) -> bool:
        """Returns True if vote just resolved."""
        if room.phase != Phase.TEAM_VOTE:
            raise ValueError("当前不是投票阶段")
        room.team_votes[player_id] = approve
        if len(room.team_votes) < len(room.players):
            return False
        approvals = sum(1 for v in room.team_votes.values() if v)
        rejected = approvals <= len(room.players) // 2
        room.last_vote_tally = {
            "approvals": approvals,
            "rejects": len(room.players) - approvals,
            "votes": dict(room.team_votes),
            "approved": not rejected,
        }
        if rejected:
            room.reject_count += 1
            if room.reject_count >= config.MAX_TEAM_REJECTIONS:
                room.winner = "evil"
                room.win_reason = "连续五次组队被否决"
                room.phase = Phase.ENDED
                return True
            room.leader_id = room.next_leader()
            room.proposed_team = []
            room.team_votes = {}
            room.phase = Phase.TEAM_PROPOSE
            return True
        room.reject_count = 0
        room.quest_cards = {}
        room.phase = Phase.QUEST
        return True

    def play_quest_card(self, room: Room, player_id: str, success: bool) -> bool:
        """Returns True if quest just resolved."""
        if room.phase != Phase.QUEST:
            raise ValueError("当前不是出任务阶段")
        if player_id not in room.proposed_team:
            raise ValueError("你不在任务队伍中")
        role = room.players[player_id].role
        if role in config.GOOD_ROLES and not success:
            raise ValueError("好人必须出成功")
        room.quest_cards[player_id] = success
        if len(room.quest_cards) < len(room.proposed_team):
            return False
        fail_count = sum(1 for ok in room.quest_cards.values() if not ok)
        needed = config.fails_needed_for_quest(room.target_players, room.quest_index)
        failed = fail_count >= needed
        room.last_quest_fail_count = fail_count
        room.quest_results[room.quest_index] = not failed
        successes = sum(1 for r in room.quest_results if r is True)
        failures = sum(1 for r in room.quest_results if r is False)
        if failures >= config.QUESTS_TO_WIN:
            room.winner = "evil"
            room.win_reason = "三次任务失败"
            room.phase = Phase.ENDED
            return True
        if successes >= config.QUESTS_TO_WIN:
            room.phase = Phase.ASSASSIN
            return True
        room.quest_index += 1
        room.leader_id = room.next_leader()
        room.proposed_team = []
        room.team_votes = {}
        room.quest_cards = {}
        room.phase = Phase.TEAM_PROPOSE
        return True

    def assassinate(self, room: Room, actor_id: str, target_id: str) -> None:
        if room.phase != Phase.ASSASSIN:
            raise ValueError("当前不是刺杀阶段")
        assassin = next(
            (p for p in room.players.values() if p.role == config.ASSASSIN),
            None,
        )
        if not assassin or actor_id != assassin.player_id:
            raise ValueError("只有刺客可以刺杀")
        if target_id not in room.players:
            raise ValueError("无效目标")
        room.assassin_target = target_id
        target = room.players[target_id]
        if target.role == config.MERLIN:
            room.winner = "evil"
            room.win_reason = "刺客成功刺杀梅林"
        else:
            room.winner = "good"
            room.win_reason = "正方完成三胜且梅林幸存"
        room.phase = Phase.ENDED

    def rematch(self, room: Room, actor_id: str) -> None:
        if actor_id != room.host_id:
            raise ValueError("仅房主可再来一局")
        for p in room.players.values():
            p.role = None
            p.role_acked = False
        room.phase = Phase.LOBBY
        room.leader_id = None
        room.quest_index = 0
        room.quest_results = [None] * 5
        room.reject_count = 0
        room.proposed_team = []
        room.team_votes = {}
        room.quest_cards = {}
        room.winner = None
        room.win_reason = None
        room.assassin_target = None
        room.last_vote_tally = None
        room.last_quest_fail_count = None

    def add_bots(self, room: Room, actor_id: str, count: int | None = None) -> int:
        """Fill empty seats with AI. Returns number added."""
        from . import ai as ai_mod

        if actor_id != room.host_id:
            raise ValueError("仅房主可添加 AI")
        if room.phase != Phase.LOBBY:
            raise ValueError("对局已开始")
        slots = room.target_players - len(room.players)
        if slots <= 0:
            raise ValueError("房间已满")
        n = slots if count is None else min(max(int(count), 1), slots)
        used = {p.name for p in room.players.values()}
        names = [nm for nm in ai_mod.BOT_NAMES if nm not in used]
        random.shuffle(names)
        added = 0
        for i in range(n):
            name = names[i] if i < len(names) else f"AI-{secrets.token_hex(2)}"
            bot = Player(
                player_id=secrets.token_hex(8),
                name=name,
                seat=len(room.players),
                is_ai=True,
                connected=True,
            )
            room.players[bot.player_id] = bot
            added += 1
        return added

    def remove_bots(self, room: Room, actor_id: str) -> int:
        if actor_id != room.host_id:
            raise ValueError("仅房主可移除 AI")
        if room.phase != Phase.LOBBY:
            raise ValueError("对局已开始")
        bots = [pid for pid, p in room.players.items() if p.is_ai]
        for pid in bots:
            del room.players[pid]
        for i, p in enumerate(sorted(room.players.values(), key=lambda x: x.seat)):
            p.seat = i
        return len(bots)


def vision_for(room: Room, viewer: Player) -> dict[str, Any]:
    """Private night-info for a player after roles assigned."""
    if not viewer.role:
        return {}
    by_role: dict[str, list[dict[str, str]]] = {}
    for p in room.players.values():
        if not p.role:
            continue
        by_role.setdefault(p.role, []).append({"id": p.player_id, "name": p.name})

    evil_visible_to_merlin = []
    evil_known_to_each_other = []
    for p in room.players.values():
        if p.role in config.EVIL_ROLES and p.role != config.OBERON:
            evil_known_to_each_other.append({"id": p.player_id, "name": p.name})
        if p.role in config.EVIL_ROLES and p.role != config.MORDRED:
            evil_visible_to_merlin.append({"id": p.player_id, "name": p.name})

    if viewer.role == config.MERLIN:
        return {"sees_evil": evil_visible_to_merlin}
    if viewer.role == config.PERCIVAL:
        candidates = []
        for p in room.players.values():
            if p.role in (config.MERLIN, config.MORGANA):
                candidates.append({"id": p.player_id, "name": p.name})
        random.Random(room.room_id + viewer.player_id).shuffle(candidates)
        return {"sees_merlin_candidates": candidates}
    if viewer.role in config.EVIL_ROLES and viewer.role != config.OBERON:
        mates = [e for e in evil_known_to_each_other if e["id"] != viewer.player_id]
        return {"sees_evil_allies": mates}
    return {}


def public_state(room: Room) -> dict[str, Any]:
    sizes = config.QUEST_TEAM_SIZES[room.target_players]
    return {
        "roomId": room.room_id,
        "hostId": room.host_id,
        "targetPlayers": room.target_players,
        "phase": room.phase.value,
        "rolesPreset": room.role_list(),
        "usingCustomRoles": room.custom_roles is not None,
        "players": [
            {
                "id": p.player_id,
                "name": p.name,
                "seat": p.seat,
                "connected": p.connected,
                "isHost": p.player_id == room.host_id,
                "roleAcked": p.role_acked,
                "isAi": p.is_ai,
                # role only in ended or private payload
                "role": p.role if room.phase == Phase.ENDED else None,
            }
            for p in room.ordered_players()
        ],
        "leaderId": room.leader_id,
        "questIndex": room.quest_index,
        "questTeamSize": sizes[room.quest_index] if room.quest_index < 5 else None,
        "questSizes": list(sizes),
        "questResults": room.quest_results,
        "failsNeeded": config.fails_needed_for_quest(room.target_players, room.quest_index),
        "rejectCount": room.reject_count,
        "maxRejects": config.MAX_TEAM_REJECTIONS,
        "proposedTeam": room.proposed_team,
        "votesSubmitted": list(room.team_votes.keys()),
        "questSubmitted": list(room.quest_cards.keys()),
        "lastVoteTally": room.last_vote_tally,
        "lastQuestFailCount": room.last_quest_fail_count,
        "winner": room.winner,
        "winReason": room.win_reason,
        "assassinTarget": room.assassin_target,
        "goodEvil": list(config.GOOD_EVIL_COUNT[room.target_players]),
        "roleLabels": config.ROLE_LABELS_ZH,
    }


def private_state(room: Room, player: Player) -> dict[str, Any]:
    return {
        "playerId": player.player_id,
        "role": player.role,
        "roleLabel": config.ROLE_LABELS_ZH.get(player.role or "", ""),
        "isGood": player.role in config.GOOD_ROLES if player.role else None,
        "vision": vision_for(room, player) if room.phase != Phase.LOBBY else {},
        "canAssassinate": (
            room.phase == Phase.ASSASSIN and player.role == config.ASSASSIN
        ),
    }

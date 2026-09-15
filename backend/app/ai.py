"""Simple heuristic bots for solo testing / filling seats."""

from __future__ import annotations

import random
from typing import TYPE_CHECKING

from . import config
from .room import Phase

if TYPE_CHECKING:
    from .room import Player, Room, RoomManager

BOT_NAMES = [
    "亚瑟机甲",
    "圆桌芯核",
    "暗影算法",
    "湖中字节",
    "圣杯脚本",
    "骑士进程",
    "莫德雷德β",
    "梅林镜像",
    "派西探针",
    "刺客线程",
]


def _evil_ids(room: Room) -> set[str]:
    return {
        p.player_id
        for p in room.players.values()
        if p.role in config.EVIL_ROLES
    }


def _pick_team(room: Room, leader: Player, size: int) -> list[str]:
    players = room.ordered_players()
    ids = [p.player_id for p in players]
    evil = _evil_ids(room)
    is_evil = leader.role in config.EVIL_ROLES

    if is_evil and leader.role != config.OBERON:
        allies = [pid for pid in ids if pid in evil]
        others = [pid for pid in ids if pid not in evil]
        team = [leader.player_id]
        # Often include one ally to fail later
        pool = [a for a in allies if a != leader.player_id]
        random.shuffle(pool)
        random.shuffle(others)
        for pid in pool + others:
            if len(team) >= size:
                break
            if pid not in team:
                team.append(pid)
        while len(team) < size:
            cand = random.choice(ids)
            if cand not in team:
                team.append(cand)
        return team[:size]

    # Good / Oberon: prefer self + random others
    team = [leader.player_id]
    rest = [pid for pid in ids if pid != leader.player_id]
    random.shuffle(rest)
    team.extend(rest[: size - 1])
    return team[:size]


def _vote_approve(room: Room, voter: Player) -> bool:
    team = set(room.proposed_team)
    evil = _evil_ids(room)
    on_team = voter.player_id in team
    reject_pressure = room.reject_count >= 3

    if voter.role in config.GOOD_ROLES:
        if reject_pressure:
            return True
        if on_team:
            return random.random() < 0.85
        return random.random() < 0.55

    # Evil
    evil_on_team = len(team & evil)
    if reject_pressure:
        return True
    if evil_on_team >= 1:
        return random.random() < 0.75
    return random.random() < 0.35


def _quest_success(room: Room, player: Player) -> bool:
    if player.role in config.GOOD_ROLES:
        return True
    successes = sum(1 for r in room.quest_results if r is True)
    failures = sum(1 for r in room.quest_results if r is False)
    needed = config.fails_needed_for_quest(room.target_players, room.quest_index)
    # More aggressive when good is close to winning
    fail_chance = 0.55
    if successes >= 2:
        fail_chance = 0.9
    if failures >= 2:
        fail_chance = 0.95
    if needed >= 2:
        fail_chance = min(0.95, fail_chance + 0.1)
    return random.random() >= fail_chance


def _assassin_target(room: Room, assassin: Player) -> str:
    evil = _evil_ids(room)
    candidates = [p for p in room.players.values() if p.player_id not in evil]
    # Prefer players who were often on successful quests / leaders — lightweight heuristic
    scored: list[tuple[float, str]] = []
    for p in candidates:
        score = random.random()
        if p.role == config.PERCIVAL:
            score += 0.15  # bots don't know role; skip — they don't know
        scored.append((score, p.player_id))
    # Bias toward non-self random goods
    scored.sort(reverse=True)
    return scored[0][1] if scored else assassin.player_id


def step_bots(manager: RoomManager, room: Room) -> bool:
    """Perform at most one bot action. Returns True if something changed."""
    bots = [p for p in room.players.values() if p.is_ai]
    if not bots:
        return False

    if room.phase == Phase.ROLE_REVEAL:
        for bot in bots:
            if not bot.role_acked:
                manager.ack_role(room, bot.player_id)
                return True
        return False

    if room.phase == Phase.TEAM_PROPOSE and room.leader_id:
        leader = room.players.get(room.leader_id)
        if leader and leader.is_ai:
            size = config.QUEST_TEAM_SIZES[room.target_players][room.quest_index]
            team = _pick_team(room, leader, size)
            manager.propose_team(room, leader.player_id, team)
            return True
        return False

    if room.phase == Phase.TEAM_VOTE:
        for bot in bots:
            if bot.player_id not in room.team_votes:
                manager.cast_team_vote(room, bot.player_id, _vote_approve(room, bot))
                return True
        return False

    if room.phase == Phase.QUEST:
        for bot in bots:
            if bot.player_id in room.proposed_team and bot.player_id not in room.quest_cards:
                manager.play_quest_card(room, bot.player_id, _quest_success(room, bot))
                return True
        return False

    if room.phase == Phase.ASSASSIN:
        assassin = next((p for p in bots if p.role == config.ASSASSIN), None)
        if assassin:
            target = _assassin_target(room, assassin)
            manager.assassinate(room, assassin.player_id, target)
            return True
        return False

    return False

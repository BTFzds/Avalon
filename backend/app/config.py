"""Official Avalon tables and default role setups."""

from __future__ import annotations

from typing import Final

GOOD_EVIL_COUNT: Final[dict[int, tuple[int, int]]] = {
    5: (3, 2),
    6: (4, 2),
    7: (4, 3),
    8: (5, 3),
    9: (6, 3),
    10: (6, 4),
}

# Quest team sizes for missions 1..5
QUEST_TEAM_SIZES: Final[dict[int, tuple[int, int, int, int, int]]] = {
    5: (2, 3, 2, 3, 3),
    6: (2, 3, 4, 3, 4),
    7: (2, 3, 3, 4, 4),
    8: (3, 4, 4, 5, 5),
    9: (3, 4, 4, 5, 5),
    10: (3, 4, 4, 5, 5),
}

MAX_TEAM_REJECTIONS: Final[int] = 5
QUESTS_TO_WIN: Final[int] = 3

# Roles
MERLIN = "merlin"
PERCIVAL = "percival"
SERVANT = "servant"
ASSASSIN = "assassin"
MORGANA = "morgana"
MORDRED = "mordred"
OBERON = "oberon"
MINION = "minion"

GOOD_ROLES = {MERLIN, PERCIVAL, SERVANT}
EVIL_ROLES = {ASSASSIN, MORGANA, MORDRED, OBERON, MINION}

ROLE_LABELS_ZH: Final[dict[str, str]] = {
    MERLIN: "梅林",
    PERCIVAL: "派西维尔",
    SERVANT: "忠臣",
    ASSASSIN: "刺客",
    MORGANA: "莫甘娜",
    MORDRED: "莫德雷德",
    OBERON: "奥伯伦",
    MINION: "爪牙",
}

# Default recommended setups by seat count (good then evil lists)
DEFAULT_ROLES: Final[dict[int, list[str]]] = {
    5: [MERLIN, PERCIVAL, SERVANT, MORGANA, ASSASSIN],
    6: [MERLIN, PERCIVAL, SERVANT, SERVANT, MORGANA, ASSASSIN],
    7: [MERLIN, PERCIVAL, SERVANT, SERVANT, MORGANA, ASSASSIN, OBERON],
    8: [MERLIN, PERCIVAL, SERVANT, SERVANT, SERVANT, MORGANA, ASSASSIN, MORDRED],
    9: [
        MERLIN,
        PERCIVAL,
        SERVANT,
        SERVANT,
        SERVANT,
        SERVANT,
        MORGANA,
        ASSASSIN,
        MORDRED,
    ],
    10: [
        MERLIN,
        PERCIVAL,
        SERVANT,
        SERVANT,
        SERVANT,
        SERVANT,
        MORGANA,
        ASSASSIN,
        MORDRED,
        OBERON,
    ],
}


def fails_needed_for_quest(player_count: int, quest_index: int) -> int:
    """quest_index is 0-based. Quest 4 (index 3) needs 2 fails at 7+ players."""
    if player_count >= 7 and quest_index == 3:
        return 2
    return 1


def validate_role_list(roles: list[str], player_count: int) -> str | None:
    good, evil = GOOD_EVIL_COUNT[player_count]
    if len(roles) != player_count:
        return f"需要恰好 {player_count} 个角色"
    good_n = sum(1 for r in roles if r in GOOD_ROLES)
    evil_n = sum(1 for r in roles if r in EVIL_ROLES)
    if good_n != good or evil_n != evil:
        return f"好/坏人数应为 {good}/{evil}，当前 {good_n}/{evil_n}"
    if MERLIN not in roles:
        return "必须包含梅林"
    if ASSASSIN not in roles:
        return "必须包含刺客"
    unknown = [r for r in roles if r not in GOOD_ROLES | EVIL_ROLES]
    if unknown:
        return f"未知角色: {unknown}"
    return None

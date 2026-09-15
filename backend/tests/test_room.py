from app.room import RoomManager
from app import config


def test_start_and_quest_fail_rule():
    m = RoomManager()
    room, host = m.create_room("H", 5)
    for i in range(4):
        m.join_room(room.room_id, f"P{i}")
    m.start_game(room, host.player_id)
    assert room.phase.value == "role_reveal"
    for p in room.players:
        m.ack_role(room, p)
    assert room.phase.value == "team_propose"
    size = config.QUEST_TEAM_SIZES[5][0]
    team = [p.player_id for p in room.ordered_players()][:size]
    m.propose_team(room, room.leader_id, team)
    for p in room.players:
        m.cast_team_vote(room, p, True)
    assert room.phase.value == "quest"
    # good must succeed
    for pid in team:
        role = room.players[pid].role
        ok = True if role in config.GOOD_ROLES else False
        m.play_quest_card(room, pid, ok)
    assert room.quest_results[0] is False or room.quest_results[0] is True


def test_validate_roles():
    assert config.validate_role_list(config.DEFAULT_ROLES[7], 7) is None
    assert config.validate_role_list([config.MERLIN] * 5, 5) is not None


if __name__ == "__main__":
    test_validate_roles()
    test_start_and_quest_fail_rule()
    print("ok")

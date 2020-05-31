from flask import Flask, Response, render_template
from flask_caching import Cache
import uuid
import random
import collections
import json
import os
import copy

app = Flask(__name__)

# Cacheインスタンスの作成
cache = Cache(app, config={
    'CACHE_TYPE': 'redis',
    'CACHE_REDIS_URL': os.environ.get('REDIS_URL', 'redis://localhost:6379'),
    'CACHE_DEFAULT_TIMEOUT': 60 * 60 * 2,
})


game_boards = {
    5: [2,3,2,3,3],
    6: [2,3,4,3,4],
    7: [2,3,3,4,4],
    8: [3,4,4,5,5],
    9: [3,4,4,5,5],
    10: [3,4,4,5,5],
}

'''
role
 0: merlin
 1: assasin
 2: The good team - servants of Arthur
 3: The evil team - servants of Mordred
'''


@app.route('/')
def homepage():
    return render_template('index.html')


# create the game group
@app.route('/create')
@app.route('/create/<nickname>')
def create_game(nickname=''):
    game = {
        'status': 'waiting',
        'players': []}
    player = {}

    gameid = str(uuid.uuid4())
    game['gameid'] = gameid
    player['playerid'] = gameid
    player['nickname'] = nickname
    game['players'].append(player)

    app.logger.debug(gameid)
    app.logger.debug(game)
    cache.set(gameid, game)
    return gameid


# re:wait the game
@app.route('/<gameid>/waiting')
def waiting_game(gameid):
    game = cache.get(gameid)
    game['status'] = 'waiting'
    cache.set(gameid, game)
    return 'reset game status'


# join the game
@app.route('/<gameid>/join')
@app.route('/<gameid>/join/<nickname>')
def join_game(gameid, nickname=''):
    game = cache.get(gameid)
    if game['status'] == 'waiting':
        player = {}

        playerid = str(uuid.uuid4())
        player['playerid'] = playerid
        if nickname == '':
            player['nickname'] = playerid
        else:
            player['nickname'] = nickname
        game['players'].append(player)

        cache.set(gameid, game)
        return playerid + ' ,' + player['nickname'] + ' ,' + game['status']
    else:
        return 'Already started'


# start the game
@app.route('/<gameid>/start')
def start_game(gameid):
    game = cache.get(gameid)
    game['status'] = 'started'
    game['routeidx'] = 0
    game['rejectcount'] = 0
    game['mordreds'] = []

    game['stocks'] = list(range(len(game['players'])))
    random.shuffle(game['stocks'])

    # Distribute each role to players
    for player in game['players']:
        if float(game['stocks'][0] + 1) / len(game['players']) < 0.67:
            if game['stocks'][0] == 0:
                player['role'] = 0
            else:
                player['role'] = 2
        elif float(game['stocks'][0] + 1) / len(game['players']) >= 0.67:
            if game['stocks'][0] == len(game['players'])-1:
                player['role'] = 1
            else:
                player['role'] = 3
            game['mordreds'].append(player)
        game['stocks'].pop(0)

    routelist = copy.copy(game['players'])
    random.shuffle(routelist)
    game['routelist'] = routelist
    game['selectedcandidates'] = []
    game['votelist'] = []
    game['results'] = []

    # choice game game_boards
    game['gameboard'] = game_boards[len(game['players'])]

    cache.set(gameid, game)
    return 'ok'


# choice phase
@app.route('/<gameid>/choice/<candidatelist>')
def choice_phase(gameid, candidatelist):
    game = cache.get(gameid)

    game['status'] = 'candidate'

    candidatelists = []
    candidatelists = candidatelist.split(',')
    # app.logger.debug(candidatelists)
    # # app.logger.debug(candidatelists[0])
    # # app.logger.debug(candidatelists[1])
    # app.logger.debug('----------------')

    game['selectedcandidates'] = []
    for player in game['players']:
        # app.logger.debug(player['playerid'])
        # app.logger.debug(candidatelists)
        if player['playerid'] in candidatelists:
            game['selectedcandidates'].append(player)

    cache.set(gameid, game)
    return 'ok'


# vote phase
@app.route('/<gameid>/vote/<vote>')
def vote_phase(gameid, vote):
    game = cache.get(gameid)

    # vote 0 or 1
    game['votelist'].append(vote)

    cache.set(gameid, game)
    return 'ok'


# expedition players
@app.route('/<gameid>/expedition')
def expedition_phase(gameid):
    game = cache.get(gameid)

    c = collections.Counter(game['votelist'])
    app.logger.debug(c)
    if c['0'] <= float(len(game['votelist']) / 2):
        # failed vote
        game['selectedcandidates'] = []
        game['votelist'] = []
        game['routeidx'] = (game['routeidx'] + 1) % len(game['players'])
        game['status'] = 'started'
        game['rejectcount'] += 1
        if game['rejectcount'] == 5:
            game['results'].append('failed')
            game['rejectcount'] = 0

        cache.set(gameid, game)
        return 'retry'

    game['rejectcount'] = 0
    game['status'] = 'expedition'
    game['votelist'] = []

    cache.set(gameid, game)
    return 'ok'


# expedition successed or failed
@app.route('/<gameid>/successedorfailed')
def successedorfailed(gameid):
    game = cache.get(gameid)

    c = collections.Counter(game['votelist'])
    if c['0'] == len(game['selectedcandidates']):
        # successed
        game['results'].append('successed')
    else:
        # failed
        game['results'].append('failed')

    if len(game['results']) == 5:
        game['status'] = 'end'
        cache.set(gameid, game)
        return 'end'

    game['routeidx'] = (game['routeidx'] + 1) % len(game['players'])
    game['status'] = 'started'

    cache.set(gameid, game)
    return 'ok'


# all status the game
@app.route('/<gameid>/status')
def game_status(gameid):
    game = cache.get(gameid)

    return json.dumps(game)


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
    # app.run(debug=True)

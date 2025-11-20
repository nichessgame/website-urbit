<template>
  <v-container max-width="1000px" class="pa-0">
    <TheChessboard 
      @board-created="handleBoardCreated"
      @move="handleMove"
      @checkmate="handleCheckmate"
      @draw="handleDraw"
      :player-color="props.color"
      :key="props.gameId"
      class="mt-10"
    />

    <div class="nav-bar">
      <button 
        @click="selectedOption = 'game'"
        :class="{ gold: selectedOption === 'game' }"
      >
      Game
      </button>

      <button 
        @click="selectedOption = 'active_games'"
        :class="{ gold: selectedOption === 'active_games' }"
      >
      Active Games
      </button>
      <button 
        @click="selectedOption = 'challenges'"
        :class="{ gold: selectedOption === 'challenges' }"
      >
      Challenges
      </button>
    </div>


    <div v-if="selectedOption === 'game'">
      <v-container>
        <div> Game ID: {{ appStore.activeGame.gameID }} </div>
        <div class="mt-2"> Status: {{ appStore.activeGame.status }} </div>
        <div class="mt-2"> White: {{ appStore.activeGame.white }} </div>
        <div class="mt-2"> Black: {{ appStore.activeGame.black }} </div>
        <div class="mt-2" v-if="resignClicked">
          Are you sure?
          <v-btn 
            size="small"
            @click="resign"
            class="ml-2"
          >
            Yes
          </v-btn>
          <v-btn 
            size="small"
            @click="resignClicked=false"
            class="ml-2"
          >
            No
          </v-btn>

        </div>
        <div class="mt-2" v-else>
          Options:
          <v-btn 
            size="small"
            @click="resignClicked=true"
            class="ml-2"
          >
            Resign
          </v-btn>

        </div>

        <div class="move-history">
          <div v-if="appStore.activeGame.urbitHistory.length === 0">No moves yet</div>
          <div v-else>
            <div class="move-list">
              <div v-for="(move, index) in appStore.activeGame.urbitHistory" :key="index" class="move-item">
                <span class="move-number">{{ Math.floor(index/2) + 1 }}{{ index % 2 === 0 ? '.' : '...' }}</span>
                <span class="move-notation">{{ move.from }} -> {{ move.to }}</span>
              </div>
            </div>
          </div>
        </div>
      </v-container>
    </div>
    <div v-else-if="selectedOption === 'active_games'">
      <v-container>
        <div v-if="appStore.activeGames.size === 0">No active games</div>
        <div v-else>
          <div v-for="[gameID, players] in appStore.activeGames" :key="gameID" class="active-game">
            <div class="game-id">{{ gameID }}</div>
            <div class="mt-2">
              <div>White: {{ players.white }}</div>
              <div>Black: {{ players.black }}</div>
            </div>
            <v-btn 
              class="mt-2"
              size="small"
              variant="tonal"
              @click="setActiveGame(gameID)"
              >
              Select
            </v-btn>
          </div>
        </div>
      </v-container>
    </div>
    <div v-else-if="selectedOption === 'challenges'">
      <v-container>
      <div> Send challenge </div>
      <div class="mt-4">
        <v-text-field 
          type="text" 
          v-model="opponentID" 
          placeholder="~sampel-palnet"
        />
          
        <v-select 
          v-model="selectedColor" 
          :items="['White', 'Black']"
        />

        <v-btn 
          @click="sendChallenge"
        >
          Send
        </v-btn>
      </div>

      <br>
      <div class="white-text">
        <div> Challenges received </div>
        <li v-for="[key, value] in appStore.challengesReceived" :key="key">
          <div>
            <div class="mt-2">
            {{ key }} - {{ value.challengerSide }}
            </div>
            <div class="mt-2">
              <v-btn 
                @click="acceptChallenge(key)"
                size="small"
              >
                Accept
              </v-btn>
              <v-btn 
                @click="declineChallenge(key)"
                class="ml-2"
                size="small"
              >
                Decline
              </v-btn>
            </div>
          </div>
        </li>
        <br>
        <div> Challenges sent </div>
        <li v-for="[key, value] in appStore.challengesSent" :key="key">
          <div class="container">
            <div class="mt-2">
            {{ key }} - {{ value.challengerSide }}
            </div>
          </div>
        </li>
        <br>
      </div>
      </v-container>
    </div>

  </v-container>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { TheChessboard } from 'vue3-nichessboard';
import 'vue3-nichessboard/style.css';
import { useAppStore } from '../stores/app';

import { urbitResign } from '@/helper/UrbitUtil.ts';

const appStore = useAppStore();
//const boardWorker = appStore.initBoardWorker(); // TODO
//const gameId = Date.now();
const moveHistory = ref([]);
let localHistory = [];
const selectedOption = ref('game'); // { game, active_games, challenges }
const selectedColor = ref('White'); // { White, Black }
const opponentID = ref(''); // urbit ID
const player1ID = ref(''); // urbit ID
const player2ID = ref(''); // urbit ID
//let activeGame = ref({gameID: '', urbitHistory: [], white: '', black: '', status: ''})
const myID = ref('~' + window.ship); // urbit ID
const resignClicked = ref(false);

const chessSquares = [
    'a1', 'b1', 'c1', 'd1', 'e1', 'f1', 'g1', 'h1',
    'a2', 'b2', 'c2', 'd2', 'e2', 'f2', 'g2', 'h2',
    'a3', 'b3', 'c3', 'd3', 'e3', 'f3', 'g3', 'h3',
    'a4', 'b4', 'c4', 'd4', 'e4', 'f4', 'g4', 'h4',
    'a5', 'b5', 'c5', 'd5', 'e5', 'f5', 'g5', 'h5',
    'a6', 'b6', 'c6', 'd6', 'e6', 'f6', 'g6', 'h6',
    'a7', 'b7', 'c7', 'd7', 'e7', 'f7', 'g7', 'h7',
    'a8', 'b8', 'c8', 'd8', 'e8', 'f8', 'g8', 'h8'
];

// Helper function for null callbacks
function emptyFunction() {}

function sendChallenge() {
  if (opponentID.value.trim() === '') {
    return;
  }
  const action = {
    'nichess-user-action': 'send-challenge',
    'who': opponentID.value,
    'challenger-side': selectedColor.value.toLowerCase(),
    'event': '',
    'practice-game': true
  }

  const pokeInput = {
    app: 'nichess',
    mark: 'nichess-user-action',
    json: action,
    onError: emptyFunction,
    onSuccess: emptyFunction
  }
  appStore.urbit.poke(pokeInput)

  opponentID.value = '';
}

function acceptChallenge(who) {
  const action = {
    'nichess-user-action': 'accept-challenge',
    'who': who
  }

  const pokeInput = {
    app: 'nichess',
    mark: 'nichess-user-action',
    json: action,
    onError: emptyFunction,
    onSuccess: emptyFunction
  }
  appStore.urbit.poke(pokeInput)
}

function declineChallenge(who) {
  const action = {
    'nichess-user-action': 'decline-challenge',
    'who': who
  }

  const pokeInput = {
    app: 'nichess',
    mark: 'nichess-user-action',
    json: action,
    onError: emptyFunction,
    onSuccess: emptyFunction
  }
  appStore.urbit.poke(pokeInput)
}

function resign() {
  if(appStore.activeGame.gameID === '') {
    console.log("Can't resign, no active game")
    return;
  }
  urbitResign(appStore.activeGame);
  appStore.activeGame.status = 'Game over';
  resignClicked.value = false;
}

let boardAPI;

function handleBoardCreated(api) {
  boardAPI = api;
  if(appStore.activeGame.gameID === '') {
    boardAPI.forbidMoves();
  }

  moveHistory.value = [];
}

function handleMove(move) {
  if(appStore.activeGame.gameID == '') {
    console.log('No active game.')
    return;
  }

  localHistory.push(move);

  const m = {
    'nichess-user-action': 'make-move',
    'nichess-move': 'move',
    'game-id': appStore.activeGame.gameID,
    'from-rank': move.from[1],
    'from-file': move.from[0],
    'to-rank': move.to[1],
    'to-file': move.to[0],
    'into': ''
  }
  const pokeInput = {
    app: 'nichess',
    mark: 'nichess-user-action',
    json: m,
    onError: emptyFunction,
    onSuccess: emptyFunction
  }
  appStore.urbit.poke(pokeInput)
}

function setActiveGame(id) {
  let activeGame = appStore.activeGames.get(id);
  if(activeGame === undefined) {
    console.log(`Tried to use setActiveGame with invalid game id: ${id}`)
    return;
  }
  resignClicked.value = false;
  boardAPI.resetBoard();
  // TODO: this is being undone every time boardAPI.move() is called.
  // Probably doesn't matter, but consider changing move() in vue3-nichessboard.
  boardAPI.forbidMoves();
  localHistory = [];
  player1ID.value = activeGame.white;
  player2ID.value = activeGame.black;
  if(player2ID.value === myID.value) {
    console.log('flippin board')
    boardAPI.toggleOrientation();
  }

  for(let i = 0; i < activeGame.urbitHistory.length; i++) {
    let m = activeGame.urbitHistory[i];
    if(boardAPI.isMoveLegal(m)) {
      boardAPI.move(m, false);
      localHistory.push(m);
      if(boardAPI.getIsGameOver()) {
        console.log('Game over')
        activeGame.status = 'Game over';
        urbitResign(activeGame);
      }
    } else {
      console.log('Illegal move. Resigning the game.');
      console.log(m);
      activeGame.status = 'Game over';
      urbitResign(activeGame);
      return;
    }
  }

  if(boardAPI.getTurnColor() == 'white') {
    activeGame.status = 'White to move';
    if(player1ID.value != myID.value) {
      boardAPI.forbidMoves()
    } else {
      boardAPI.allowMoves()
    }
  } else if(boardAPI.getTurnColor() == 'black') {
    activeGame.status = 'Black to move';
    if(player2ID.value != myID.value) {
      boardAPI.forbidMoves()
    } else {
      boardAPI.allowMoves()
    }
  }
  appStore.activeGame = activeGame;
  watch(appStore.activeGame, (newVal) => {
    updateActiveGame();
  }, { deep: true });

  updateActiveGame();
}

function updateActiveGame() {
  if(appStore.activeGame.gameID === '') {
    console.log('Tried to update active game when no active game exists.')
    return;
  }
  let activeGame = appStore.activeGame;
  if(activeGame.resigned) {
    console.log('Game is already resigned, nothing to update.')
    boardAPI.forbidMoves();
    return; 
  }
  // TODO: this is being undone every time boardAPI.move() is called.
  // Probably doesn't matter, but consider changing move() in vue3-nichessboard.
  boardAPI.forbidMoves();

  for(let i = localHistory.length; i < activeGame.urbitHistory.length; i++) {
    let m = activeGame.urbitHistory[i];
    console.log(m)
    if(boardAPI.isMoveLegal(m)) {
      boardAPI.move(m, false);
      boardAPI.forbidMoves();
      localHistory.push(m);
      if(boardAPI.getIsGameOver()) {
        console.log('Game over')
        activeGame.status = 'Game over';
        urbitResign(activeGame)
        return;
      }
    } else {
      // TODO: Show to user that there was an illegal move?
      console.log('Illegal move. Resigning the game.')
      console.log(m)
      activeGame.status = 'Game over';
      urbitResign(activeGame)
      return;
    }
  }
  if(boardAPI.getIsGameOver()) {
    console.log('Game over')
    activeGame.status = 'Game over';
    urbitResign(activeGame)
    return;
  }

  if(boardAPI.getTurnColor() == 'white') {
    activeGame.status = 'White to move';
    if(player1ID.value != myID.value) {
      boardAPI.forbidMoves()
    } else {
      boardAPI.allowMoves()
    }
  } else if(boardAPI.getTurnColor() == 'black') {
    activeGame.status = 'Black to move';
    if(player2ID.value != myID.value) {
      boardAPI.forbidMoves()
    } else {
      boardAPI.allowMoves()
    }
  }
}


function handleCheckmate(isMated) {
  console.log('checkmate')
  console.log(isMated);
}

function handleDraw() {
  console.log('draw');
}

const props = defineProps({
  color: {
    type: String,
    default: 'white'
  },
  gameId: {
    type: String,
    default: ""
  }
})

</script>

<style scoped>
.active-game {
  margin: 10px 0;
  padding: 10px;
  background-color: #222;
  border-radius: 4px;
}

.game-id {
  font-family: monospace;
  color: #aaa;
  font-size: 0.9em;
  margin-bottom: 5px;
}

.players {
  margin: 5px 0;
}

.players div {
  margin: 2px 0;
}

.select-game {
  margin-top: 8px;
  padding: 4px 8px;
  background-color: #444;
  border: 1px solid #666;
  color: white;
  border-radius: 3px;
  cursor: pointer;
}

.select-game:hover {
  background-color: #555;
}


.gold {
  color: gold !important;
}

.nav-bar {
  display: flex;
  gap: 2rem;
  padding: 1rem;
  color: white;
}

.nav-bar button {
  background: none;
  border: none;
  color: white;
  font-size: 1.1rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
}

.move-history {
  margin-top: 14px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #444;
  padding: 8px;
  background-color: #222;
}

.move-list {
  display: flex;
  flex-wrap: wrap;
}

.move-item {
  margin: 4px 8px;
  padding: 2px 6px;
  background-color: #333;
  border-radius: 4px;
  display: inline-block;
}

.move-number {
  color: #999;
  margin-right: 4px;
}

.move-notation {
  color: #fff;
  font-weight: bold;
}

</style>

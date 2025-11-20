import type { Urbit } from '@urbit/http-api';
import { useAppStore } from '@/stores/app';


// Helper function for null callbacks
function emptyFunction (): void {}

export function urbitResign(activeGame): void {
  const appStore = useAppStore()
  const action = {
    'nichess-user-action': 'resign',
    'game-id': activeGame.gameID
  }

  const pokeInput = {
    app: 'nichess',
    mark: 'nichess-user-action',
    json: action,
    onError: emptyFunction,
    onSuccess: emptyFunction
  }
  appStore.urbit.poke(pokeInput)
  activeGame.resigned = true;
}

export async function urbitReceiveActiveGame(id: string, moves: [], player1ID: string, player2ID: string) {
  const appStore = useAppStore()
  let activeGame = appStore.activeGames.get(id);
  if(activeGame !== undefined) {
    console.log(`Game with id ${id} already exists in activeGames.`)
    return;
  }
  activeGame = { gameID: id, urbitHistory: Array.from(moves), white: player1ID, black: player2ID, status: '', resigned: false };
  appStore.activeGames.set(id, activeGame);
  await appStore.urbit.subscribe({
    app: 'nichess',
    path: `/game/${id}/updates`,
    err: () => {},
    event: (data) => receiveGameUpdate(data),
    quit: () => {}
  })
}

function receiveGameUpdate(data) {
  const appStore = useAppStore()
  let activeGame = appStore.activeGames.get(data.gameID);
  if(activeGame === undefined) {
    console.log(`Tried to receiveGameUpdate for game with invalid id: ${data.gameID}`)
    return;
  }
  switch(data.nichessUpdate) {
    case 'position':
      activeGame.urbitHistory.push(data.move);
      break;
    case 'result':
      activeGame.status = 'Game over';
      activeGame.resigned = true;
      appStore.activeGames.delete(data.gameID);
      break;
    default:
      break;
  }
}

export async function urbitReceiveChallenge(data): void {
  const appStore = useAppStore()
  if(data.nichessUpdate == 'challenge-sent') {
    appStore.challengesSent.set(data.who, data)
  } else if(data.nichessUpdate == 'challenge-received') {
    appStore.challengesReceived.set(data.who, data)
  } else if(data.nichessUpdate == 'challenge-replied') {
    appStore.challengesReceived.delete(data.who);
  } else if(data.nichessUpdate == 'challenge-resolved') {
    appStore.challengesSent.delete(data.who);
  } else {
    console.log("Invalid challenge update:");
    console.log(data);
  }
}

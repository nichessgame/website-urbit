import { defineStore } from 'pinia'
import { ref } from 'vue';
import Urbit from '@urbit/http-api';


export const useAppStore = defineStore('app', {
  state: () => ({
    activeGames: ref(new Map<string, {white: string, black: string, urbitHistory: [], resigned: boolean}>()),
    activeGame: {gameID: '', urbitHistory: [], white: '', black: '', status: '', resigned: false},
    challengesSent: ref(new Map()),
    challengesReceived: ref(new Map()),
    urbit: {} as Urbit
  }),
  actions: {
    init() {},
    dosomething() {} // TODO
  }
})

<template>
  <v-app>
    <v-app-bar app scroll-behavior="collapse" scroll-threshold="1" elevation="0" color="transparent">

      <v-container class="d-flex align-center px-0">
        <v-app-bar-nav-icon @click="drawer = !drawer" class="d-sm-none" />
        <v-toolbar-title class="mr-sm-4"><v-btn to="/" :active="false" class="nav-button">Nichess</v-btn></v-toolbar-title>
        
        <div class="d-none d-sm-flex ml-auto">
          <v-btn to="/games" prepend-icon="mdi-sword" :active="false" class="nav-button">Games</v-btn>
          <v-btn to="/faq" prepend-icon="mdi-information" :active="false" class="nav-button">FAQ</v-btn>
          <v-btn to="/rules" prepend-icon="mdi-script-text" :active="false" class="nav-button">Rules</v-btn>
          <v-btn to="/donate" prepend-icon="mdi-gift" :active="false" class="donate">Donate</v-btn>

        </div>
      </v-container>
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      temporary
      class="d-sm-none"
    >
      <v-list>
        <v-list-item
          prepend-icon="mdi-sword"
          title="Games"
          to="/games"
          class="nav-button"
        />
        <v-list-item
          prepend-icon="mdi-information"
          title="FAQ"
          to="/faq"
          :active="false"
          class="nav-button"
        />
        <v-list-item
          prepend-icon="mdi-script-text"
          title="Rules"
          to="/rules"
          :active="false"
          class="nav-button"
        />

        <v-list-item
          prepend-icon="mdi-gift"
          title="Donate"
          to="/donate"
          :active="false"
          class="donate"
        />
      </v-list>
    </v-navigation-drawer>

    <router-view />
  </v-app>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from './stores/app'
import Urbit from '@urbit/http-api';
import { urbitReceiveActiveGame, urbitReceiveChallenge } from '@/helper/UrbitUtil.ts';


const drawer = ref(false)
const appStore = useAppStore()

appStore.urbit = new Urbit('', '')
appStore.urbit.ship = window.ship

console.log('Initializing Urbit')
console.log(`window.ship: ${appStore.urbit.ship}`)

onMounted(async () => {
  await appStore.urbit.subscribe({
    app: 'nichess',
    path: '/challenges',
    err: () => {},
    event: (data) => receiveChallenge(data),
    quit: () => {}
  })
  await appStore.urbit.subscribe({
    app: 'nichess',
    path: '/active-games',
    err: () => {},
    event: (data) => receiveActiveGame(data),
    quit: () => {}
  })

})

async function receiveChallenge(data) {
  await urbitReceiveChallenge(data)
}

async function receiveActiveGame(data) {
  await urbitReceiveActiveGame(data.gameID, data.moves, data.white, data.black);
}

onBeforeUnmount(() => {
  appStore.urbit.delete();
});
</script>

<style scoped>
.v-btn {
  margin-left: 8px;
}

.donate {
  color: #ffd700; /* gold */
}

.nav-button {
  color: gainsboro;
}

/* Center content on larger screens */
@media (min-width: 600px) {
  .v-container {
    max-width: 1200px;
    margin: 0 auto;
  }
}
</style>

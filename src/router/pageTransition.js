// Les pages changent avec un fondu (App.vue, mode « out-in ») : la nouvelle page n'existe qu'après.
// Le routeur attend ce moment pour rendre la position de défilement d'une liste au retour.
let waiting = []

/** Appelé par App.vue quand la nouvelle page est affichée. */
export function pageEntered() {
  const done = waiting
  waiting = []
  done.forEach((resolve) => resolve())
}

/** Promesse résolue quand la nouvelle page est affichée (au plus tard après 800 ms). */
export function whenPageEntered() {
  return new Promise((resolve) => {
    waiting.push(resolve)
    setTimeout(resolve, 800)
  })
}

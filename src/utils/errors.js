// Transforme une erreur axios en message lisible pour l'utilisateur.
// Le backend renvoie { message, errors } (validation 422) ou { code: 'phase_closed' | 'forbidden', message } (403).
export const DEFAULT_ERROR = "Une erreur est survenue. Réessayez ou contactez le responsable du cours."

export function apiErrorMessage(error, fallback = DEFAULT_ERROR) {
  const response = error && error.response
  if (!response) {
    if (error && error.code === 'ERR_CANCELED') return 'Requête annulée.'
    return 'Le serveur est injoignable. Vérifiez votre connexion.'
  }
  const data = response.data && typeof response.data === 'object' ? response.data : {}
  if (response.status === 413) return 'Le projet est trop volumineux (images trop lourdes). Réduisez la taille des images.'
  if (response.status === 422 && data.errors) {
    return Object.values(data.errors).flat().join(' ')
  }
  if (typeof data.message === 'string' && data.message && !data.message.startsWith('SQLSTATE')) {
    return data.message
  }
  if (response.status === 403) return "Vous n'avez pas les droits pour cette action."
  if (response.status === 404) return 'Ressource introuvable sur le serveur.'
  if (response.status >= 500) return 'Erreur du serveur. Réessayez dans quelques minutes.'
  return fallback
}

// Erreur dont la réponse est un Blob (export PDF) : relit le JSON d'erreur éventuel.
export async function readBlobError(error) {
  const data = error && error.response && error.response.data
  if (data instanceof Blob && data.type.includes('json')) {
    try {
      error.response.data = JSON.parse(await data.text())
    } catch {
      /* corps illisible : message par défaut */
    }
  }
  return apiErrorMessage(error)
}

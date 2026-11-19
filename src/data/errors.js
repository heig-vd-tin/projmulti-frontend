// Transforme une erreur axios en message lisible pour l'utilisateur.
export function apiErrorMessage(error, fallback = "Une erreur est survenue. Réessayez ou contactez l'administrateur.") {
  const response = error && error.response
  if (!response) return "Le serveur est injoignable. Vérifiez votre connexion."
  const data = response.data || {}
  if (response.status === 413) return "Le projet est trop volumineux (images trop lourdes). Réduisez la taille des images."
  if (response.status === 422 && data.errors) {
    return Object.values(data.errors).flat().join(' ')
  }
  if (typeof data.message === 'string' && data.message && !data.message.startsWith('SQLSTATE')) {
    return data.message
  }
  return fallback
}

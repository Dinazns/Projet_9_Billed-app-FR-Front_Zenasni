export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toISOString();
}
 
export const formatStatus = (status) => {
  switch (status) {
    case "pending":
      return "En attente"
    case "accepted":
      return "Accepté"
    case "refused":
      return "Refused"
  }
}
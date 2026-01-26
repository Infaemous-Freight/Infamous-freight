export function handlePaymentEvent(event: any) {
  if (event.type === "chargeback") {
    console.log("Chargeback detected, flagging user");
  }
}

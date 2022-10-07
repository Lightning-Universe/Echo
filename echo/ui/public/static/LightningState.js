(function () {
  const channel = new MessageChannel();

  const targetOrigin = window.navigator.userAgent.includes("Firefox")
    ? window.location.origin
    : /* eslint-disable-next-line compat/compat */
      window.location.ancestorOrigins[0];

  // We use window.location.origin as we expect the apps belongs to the same origin that the Parent containing the iframe
  window.top.postMessage("Establish communication", targetOrigin, [channel.port2]);

  class LightningState {
    static subscribe(componentHandler) {
      channel.port1.onmessage = message => {
        componentHandler(message.data);
      };

      return () => {
        channel.port1.onmessage = null;
      };
    }

    static next(state) {
      channel.port1.postMessage(state);
    }
  }

  window.LightningState = LightningState;
})();

import { echoClient } from "services/echoClient";

import { Echo } from "generated";

import mount from "tests/testMount";

import MobileDemo from "./MobileDemo";

describe("MobileDemo", () => {
  let echoesList: Echo[];

  const createEchoMenu = `[data-cy="create-echo-source-select"]`;
  const createEchoMicrophone = `[data-cy="create-echo-microphone"]`;
  const stopRecording = `[data-cy="stop-recording"]`;
  const discardSource = `[data-cy="discard-source"]`;
  const echoSourcePreview = `[data-cy="echo-source-preview"]`;
  const createEchoConfirm = `[data-cy="create-echo-confirm"]`;

  beforeEach(() => {
    cy.fixture("list-echoes.json").then((fixture: Echo[]) => {
      echoesList = fixture;

      cy.stub(echoClient.appClientCommand, "listEchoesCommandListEchoesPost")
        .as("listEchoesCommandListEchoesPost")
        .resolves(echoesList);
    });

    cy.viewport("iphone-x");

    Cypress.on("uncaught:exception", (err, runnable) => {
      // Ignore 3rd party error from `react-media-recorder`
      if (err.message.includes("There is already an encoder stored which handles exactly the same mime types")) {
        return false;
      }
    });
  });

  it("subscribes to Lightning App state on mount", () => {
    mount(<MobileDemo />);

    cy.get("@LightningState.subscribe").should("have.been.calledOnce");
  });

  it("fetches list of Echoes from API on mount", () => {
    mount(<MobileDemo />);

    cy.get("@listEchoesCommandListEchoesPost").should("have.been.called");
  });

  describe("creating an Echo from device microphone", () => {
    it("displays option to create an Echo", () => {
      mount(<MobileDemo />);

      cy.get(createEchoMenu).trigger("mouseover", { force: true });
      cy.get(createEchoMicrophone).should("be.visible");
    });

    it("displays button to stop the recording", () => {
      mount(<MobileDemo />);

      cy.get(createEchoMenu).trigger("mouseover", { force: true });
      cy.get(createEchoMicrophone).click();

      cy.get(stopRecording).should("be.visible");
    });

    it("displays controls after stopping the recording", () => {
      mount(<MobileDemo />);

      cy.get(createEchoMenu).trigger("mouseover", { force: true });
      cy.get(createEchoMicrophone).click();
      cy.get(stopRecording).click();

      cy.get(discardSource).should("be.visible");
      cy.get(createEchoConfirm).should("be.visible");
      cy.get(echoSourcePreview).should("be.visible");
    });

    it("calls API to create Echo when confirm is clicked", () => {
      cy.intercept("PUT", "http://localhost:1234/upload/*", { statusCode: 200 }).as("uploadSourceAudio");
      cy.stub(echoClient.appClientCommand, "createEchoCommandCreateEchoPost")
        .as("createEchoCommandCreateEchoPost")
        .resolves(null);

      mount(<MobileDemo />);

      cy.get(createEchoMenu).trigger("mouseover", { force: true });
      cy.get(createEchoMicrophone).click();
      cy.get(stopRecording).click();
      cy.get(createEchoConfirm).click();

      cy.wait("@uploadSourceAudio");
      cy.get("@createEchoCommandCreateEchoPost").should("have.been.called");
    });
  });
});

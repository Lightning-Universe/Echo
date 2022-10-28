import "cypress-iframe";

describe("creating an Echo from a YouTube URL", () => {
  const createEchoYouTube = `[data-cy="create-echo-youtube"]`;
  const createEchoButton = `[data-cy="create-echo-confirm"]`;
  const discardSourceButton = `[data-cy="discard-source"]`;
  const createEchoNameInput = `[data-cy="create-echo-name"] > input`;
  const createEchoYouTubeURLInput = `[data-cy="create-echo-youtube-url"] > input`;
  const selectEchoButtonFor = (echoID: string) => `[data-cy="select-echo-${echoID}"]`;
  const subtitleFor = (index: number) => `[data-cy="subtitle-${index}"]`;
  const videoPreview = `[data-cy="video-preview"]`;

  const displayNameExceedsMaxLength = "this display name exceeds the maximum length of 50 characters";
  const youtubeURLExceedsLengthLimit = "https://www.youtube.com/watch?v=xm3YgoEiEDc";
  const youtubeURLValid = "https://www.youtube.com/watch?v=vFwHl7W5ooE";
  const expectedText = `We are here together to talk about lightning.`;
  const echoProcessingTimeout = 60000;

  describe("using an invalid URL", () => {
    it("loads the app", () => {
      cy.intercept("/api/v1/state").as("getState");
      cy.intercept("GET", "/api/echoes?user_id=*").as("listEchoes");

      cy.visit("/");

      cy.frameLoaded();
      cy.wait("@getState");
      cy.wait("@listEchoes");
    });

    it("navigates to Echo create view when YouTube option is selected", () => {
      cy.iframe().find(createEchoYouTube).click({ force: true });

      cy.iframe().contains("Create Echo").should("be.visible");
      cy.iframe().find(createEchoButton).should("be.visible");
      cy.iframe().find(discardSourceButton).should("be.visible");
    });

    it("requires that Echo name is not empty", () => {
      cy.iframe().find(createEchoNameInput).clear();
      cy.iframe().find(createEchoButton).should("be.disabled");
    });

    it("requires that Echo name is within the length limit", () => {
      cy.iframe().find(createEchoNameInput).clear().type(displayNameExceedsMaxLength);
      cy.iframe().find(createEchoYouTubeURLInput).clear().type(youtubeURLValid);
      cy.iframe().find(createEchoButton).click();

      cy.iframe().contains("Error creating Echo: Display name must be less than 32 characters").should("be.visible");
    });

    it("requires that YouTube URL is valid", () => {
      cy.iframe().find(createEchoNameInput).clear().type("Test Echo");
      cy.iframe().find(createEchoYouTubeURLInput).clear().type("invalid-url");
      cy.iframe().find(createEchoButton).click();

      cy.iframe().contains("Error creating Echo: Invalid YouTube URL").should("be.visible");
    });

    it("requires that provided YouTube video is within the maximum duration limit", () => {
      cy.iframe().find(createEchoYouTubeURLInput).clear().type(youtubeURLExceedsLengthLimit);
      cy.iframe().find(createEchoButton).click();

      cy.iframe().contains("Error creating Echo: YouTube video exceeds maximum duration allowed").should("be.visible");
    });
  });

  describe("using a valid URL", () => {
    let createdEchoID: string;

    it("loads the app", () => {
      cy.intercept("/api/v1/state").as("getState");
      cy.intercept("/api/echoes*").as("listEchoes");

      cy.visit("/");

      cy.frameLoaded();
      cy.wait("@getState");
      cy.wait("@listEchoes");
    });

    it("displays the created Echo in the list view", () => {
      cy.iframe().find(createEchoYouTube).click({ force: true });
      cy.iframe().find(createEchoNameInput).clear().type("Test Echo");
      cy.iframe().find(createEchoYouTubeURLInput).clear().type(youtubeURLValid);
      cy.iframe().find(createEchoButton).click();

      cy.intercept("POST", "/api/echoes", req => {
        createdEchoID = req.body.id;
        req.continue(res => {
          expect(res.statusCode).to.equal(200);
        });
      });

      cy.iframe().contains("Test Echo").should("be.visible");
      cy.iframe().contains("video/mp4").should("be.visible");
    });

    it("displays message while the Echo is processing", () => {
      cy.iframe().find(selectEchoButtonFor(createdEchoID)).click();

      cy.iframe().contains("Echo is processing, please wait").should("be.visible");
    });

    it("displays the video preview of the created Echo with its captions when selected", () => {
      cy.iframe().contains("Echo is processing, please wait", { timeout: echoProcessingTimeout }).should("not.exist");
      cy.iframe().contains("Test Echo").should("be.visible");
      cy.iframe().contains(expectedText).should("be.visible");
    });

    it("clicking on a subtitle will jump the video to that timestamp", () => {
      cy.iframe().find(subtitleFor(4)).click();

      cy.iframe()
        .find(videoPreview)
        .then($video => {
          const video = $video.get(0) as HTMLVideoElement;

          expect(video.currentTime).not.to.equal(0);
        });
    });
  });
});

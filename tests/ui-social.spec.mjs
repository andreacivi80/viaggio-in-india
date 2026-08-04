import { test, expect, devices } from "@playwright/test";

const profileName = process.env.QA_UI_PROFILE_NAME;
const inviteToken = process.env.QA_UI_INVITE_TOKEN;
const coordinatorInviteToken = process.env.QA_UI_COORDINATOR_INVITE_TOKEN;
const baseUrl = (process.env.TEST_BASE_URL || "").replace(/\/$/, "");

test.skip(!profileName || !inviteToken || !coordinatorInviteToken || !baseUrl, "Profili QA, inviti e URL richiesti");

test("visitatore e viaggiatore interagiscono senza ereditare comandi non autorizzati", async ({ browser }) => {
  test.slow();
  const travelerContext = await browser.newContext({ ...devices["Galaxy S9+"] });
  const guestContext = await browser.newContext({ ...devices["Galaxy S9+"] });
  const observerContext = await browser.newContext({ ...devices["Galaxy S9+"] });
  const coordinatorContext = await browser.newContext({ ...devices["Galaxy S9+"] });
  const travelerPage = await travelerContext.newPage();
  const guestPage = await guestContext.newPage();
  const observerPage = await observerContext.newPage();
  const coordinatorPage = await coordinatorContext.newPage();
  let createdPostId = "";
  let coordinatorPostId = "";
  let coordinatorToken = "";
  try {
    await travelerPage.goto(`${baseUrl}/?invite=${encodeURIComponent(inviteToken)}`, {
      waitUntil: "networkidle",
    });
    await expect(travelerPage.locator(".accessPill")).toContainText(profileName.split(" ")[0]);
    const sessionToken = await travelerPage.evaluate(() => localStorage.getItem("india-session-token"));
    expect(sessionToken).toBeTruthy();

    const postText = `Social UI ${Date.now()}`;
    const createResponse = await travelerPage.request.post(`${baseUrl}/api/posts`, {
      headers: {
        authorization: `Bearer ${sessionToken}`,
        "x-idempotency-key": crypto.randomUUID(),
        "x-qa-silent": "true",
      },
      multipart: {
        day_index: "-1",
        visibility: "public",
        text: postText,
      },
    });
    expect(createResponse.status()).toBe(201);
    createdPostId = (await createResponse.json()).id;

    await coordinatorPage.goto(`${baseUrl}/?invite=${encodeURIComponent(coordinatorInviteToken)}`, {
      waitUntil: "networkidle",
    });
    coordinatorToken = await coordinatorPage.evaluate(() => localStorage.getItem("india-session-token"));
    expect(coordinatorToken).toBeTruthy();
    const coordinatorPostText = `Post coordinatore ${Date.now()}`;
    const coordinatorResponse = await coordinatorPage.request.post(`${baseUrl}/api/posts`, {
      headers: {
        authorization: `Bearer ${coordinatorToken}`,
        "x-idempotency-key": crypto.randomUUID(),
        "x-qa-silent": "true",
      },
      multipart: {
        day_index: "-1",
        visibility: "public",
        text: coordinatorPostText,
      },
    });
    expect(coordinatorResponse.status()).toBe(201);
    coordinatorPostId = (await coordinatorResponse.json()).id;

    await travelerPage.reload({ waitUntil: "domcontentloaded" });
    const travelerPost = travelerPage.locator(".post").filter({ hasText: postText });
    await expect(travelerPost).toBeVisible();
    await expect(travelerPost.getByRole("button", { name: "Altre opzioni" })).toBeVisible();
    const somebodyElsesPost = travelerPage.locator(".post").filter({ hasText: coordinatorPostText });
    await expect(somebodyElsesPost).toBeVisible();
    await expect(somebodyElsesPost.getByRole("button", { name: "Altre opzioni" })).toHaveCount(0);

    await guestPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const guestName = `Visitatore ${Date.now().toString().slice(-6)}`;
    await guestPage.locator(".visitorBar input").fill(guestName);
    await guestPage.locator(".visitorBar").getByRole("button", { name: "Salva" }).tap();
    expect(await guestPage.evaluate(() => localStorage.getItem("india-visitor-name"))).toBe(guestName);
    const guestPost = guestPage.locator(".post").filter({ hasText: postText });
    await expect(guestPost).toBeVisible();
    await expect(guestPost.getByRole("button", { name: "Altre opzioni" })).toHaveCount(0);

    const reactionResponse = guestPage.waitForResponse(
      (response) => response.url().includes("/api/reactions") && response.request().method() === "POST",
    );
    await guestPost.getByRole("button", { name: "Mi piace" }).tap();
    expect((await reactionResponse).status()).toBe(200);
    await expect(guestPost.locator(".likesSummary")).toContainText(guestName);
    await guestPost.locator(".likesSummary").tap();
    await expect(guestPost.locator(".likerList")).toContainText(guestName);

    await observerPage.goto(baseUrl, { waitUntil: "domcontentloaded" });
    const observerPost = observerPage.locator(".post").filter({ hasText: postText });
    await expect(observerPost).toBeVisible();

    const commentText = `Commento ${Date.now()}`;
    const commentResponse = guestPage.waitForResponse(
      (response) => response.url().includes("/api/comments") && response.request().method() === "POST",
    );
    await guestPost.getByPlaceholder("Scrivi un commento…").fill(commentText);
    await guestPost.getByRole("button", { name: "Invia commento" }).tap();
    expect((await commentResponse).status()).toBe(201);
    const ownComment = guestPost.locator(".comment").filter({ hasText: commentText });
    await expect(ownComment).toContainText(guestName);
    await observerPage.bringToFront();
    await expect(observerPost.getByText(commentText)).toBeVisible({ timeout: 15_000 });

    await guestPage.bringToFront();
    await guestPage.reload({ waitUntil: "domcontentloaded" });
    await expect(guestPage.locator(".visitorBar")).toHaveCount(0);
    const reloadedGuestPost = guestPage.locator(".post").filter({ hasText: postText });
    const reloadedOwnComment = reloadedGuestPost.locator(".comment").filter({ hasText: commentText });
    await expect(reloadedOwnComment.getByRole("button", { name: "Modifica" })).toBeVisible();
    await expect(reloadedOwnComment.getByRole("button", { name: "Elimina" })).toBeVisible();
    const observerComment = observerPost.locator(".comment").filter({ hasText: commentText });
    await expect(observerComment.getByRole("button", { name: /Modifica|Elimina/ })).toHaveCount(0);

    const editedText = `${commentText} modificato`;
    await reloadedOwnComment.getByRole("button", { name: "Modifica" }).tap();
    const commentEditor = reloadedGuestPost.locator(".commentEditor");
    await commentEditor.getByRole("textbox", { name: "Modifica commento" }).fill(editedText);
    const editResponse = guestPage.waitForResponse(
      (response) => response.url().includes("/api/comments/") && response.request().method() === "PUT",
    );
    await commentEditor.getByRole("button", { name: "Salva modifica commento" }).tap();
    expect((await editResponse).status()).toBe(200);
    await expect(reloadedGuestPost.getByText(editedText)).toBeVisible();
    await observerPage.bringToFront();
    await expect(observerPost.getByText(editedText)).toBeVisible({ timeout: 15_000 });

    await guestPage.bringToFront();
    const editedComment = reloadedGuestPost.locator(".comment").filter({ hasText: editedText });
    await editedComment.getByRole("button", { name: "Elimina" }).tap();
    const confirm = guestPage.locator(".confirmCard").filter({ hasText: "Eliminare questo commento?" });
    const deleteResponse = guestPage.waitForResponse(
      (response) => response.url().includes("/api/comments/") && response.request().method() === "DELETE",
    );
    await confirm.getByRole("button", { name: "Elimina" }).tap();
    expect((await deleteResponse).status()).toBe(200);
    await expect(reloadedGuestPost.getByText(editedText)).toHaveCount(0);
    await observerPage.bringToFront();
    await expect(observerPost.getByText(editedText)).toHaveCount(0, { timeout: 15_000 });

    await guestPage.bringToFront();
    const removeReaction = guestPage.waitForResponse(
      (response) => response.url().includes("/api/reactions") && response.request().method() === "POST",
    );
    await reloadedGuestPost.getByRole("button", { name: "Mi piace" }).tap();
    expect((await removeReaction).status()).toBe(200);
    await expect(reloadedGuestPost.getByText(guestName)).toHaveCount(0);
  } finally {
    if (createdPostId) {
      const sessionToken = await travelerPage.evaluate(() => localStorage.getItem("india-session-token")).catch(() => "");
      if (sessionToken)
        await travelerPage.request.delete(`${baseUrl}/api/posts/${encodeURIComponent(createdPostId)}`, {
          headers: { authorization: `Bearer ${sessionToken}` },
        }).catch(() => {});
    }
    if (coordinatorPostId && coordinatorToken)
      await coordinatorPage.request.delete(`${baseUrl}/api/posts/${encodeURIComponent(coordinatorPostId)}`, {
        headers: { authorization: `Bearer ${coordinatorToken}` },
      }).catch(() => {});
    await Promise.all([
      travelerContext.close(),
      guestContext.close(),
      observerContext.close(),
      coordinatorContext.close(),
    ]);
  }
});

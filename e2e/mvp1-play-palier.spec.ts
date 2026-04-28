import { test, expect, Page } from "@playwright/test";

/**
 * MVP-1 — full palier play-through E2E.
 *
 * Crée un compte, joue les 10 exos en sélectionnant la 1ère option,
 * soumet le palier, capture les screenshots de chaque étape.
 *
 * Coût IA : ~$0.05 (palier déjà cached probablement, sinon 1ère gen)
 */

async function registerAndLogin(page: Page): Promise<void> {
  const ts = Date.now();
  const email = `play-${ts}@jotna.test`;
  const password = "TestPass123!";

  await page.goto("/register");
  await page.locator('input[type="text"]').fill(`Play ${ts}`);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator("select").selectOption("student");
  await page.getByRole("button", { name: /Créer un compte|S'inscrire/i }).first().click();

  await page.waitForFunction(() => !location.pathname.includes("/register"), {
    timeout: 30_000,
  });
  if (page.url().includes("/login")) {
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole("button", { name: /Se connecter/i }).first().click();
    await page.waitForFunction(() => !location.pathname.includes("/login"), {
      timeout: 30_000,
    });
  }
  await page.waitForTimeout(3000); // auth settle
}

async function playOneExercise(page: Page, idx: number): Promise<string> {
  // Wait for exo to render
  await page.waitForTimeout(800);

  // Capture state
  await page.screenshot({
    path: `.context/screenshots/play-${String(idx).padStart(2, "0")}-exo.png`,
    fullPage: true,
  });

  // Try to find and click an answer option:
  // - QCM: option button with text
  // - Short answer: input + click Valider
  // - Other types: best effort

  // Try short-answer first (input + valider)
  const inputCount = await page.locator('input[type="text"]').count();
  if (inputCount > 0) {
    await page.locator('input[type="text"]').first().fill("0");
    await page.getByRole("button", { name: /^Valider$/ }).first().click();
  } else {
    // QCM/Match/Order/DragDrop: click first option using structural CSS
    // Option buttons in QcmExercise have class "border-3" (unique to options)
    const qcmOpts = page.locator("button.border-3");
    const qcmCount = await qcmOpts.count();
    if (qcmCount > 0) {
      await qcmOpts.first().click();
      await page.waitForTimeout(400);
      // Valider button is now enabled
      const valider = page.locator(
        'button:not([disabled]):has-text("Valider")',
      );
      if ((await valider.count()) > 0) {
        await valider.first().click();
      }
    } else {
      // Try clicking any button that's not header/quit/hint
      const buttons = page.locator("main button, [role='main'] button");
      // Submit whatever Valider is available
      const valider = page.locator(
        'button:not([disabled]):has-text("Valider")',
      );
      if ((await valider.count()) > 0) {
        await valider.first().click();
      } else if ((await buttons.count()) > 2) {
        // For drag-drop / match / order: just click submit
        await buttons.first().click();
      }
    }
  }

  // Wait for feedback / next
  await page.waitForTimeout(2000);

  // Detect result (correct/incorrect)
  const body = (await page.textContent("body")) ?? "";
  let result = "unknown";
  if (body.includes("Bravo")) result = "correct";
  else if (body.includes("Pas tout") || body.includes("Tu peux passer")) result = "incorrect";
  else if (body.includes("Palier")) result = "palier_end";

  // Click Next/Suivant or "Voir mon résultat"
  const nextBtn = page.getByRole("button", {
    name: /Suivant|Voir mon résultat|Réessayer/i,
  });
  if ((await nextBtn.count()) > 0) {
    await nextBtn.first().click();
  }
  await page.waitForTimeout(800);

  return result;
}

test.describe("MVP-1 — play full palier", () => {
  test("plays through 10 exos and submits palier", async ({ page }) => {
    test.setTimeout(180_000);

    await registerAndLogin(page);

    // Navigate via dashboard click
    await page.goto("/student/home");
    await page.waitForTimeout(3000);
    await page.getByRole("link", { name: /Mathématiques/i }).first().click();
    await page.waitForTimeout(3000);
    await page.getByText(/Commencer/i).first().click();
    await page.waitForTimeout(8000); // wait for palier load (cached)

    await page.screenshot({
      path: ".context/screenshots/play-00-palier-start.png",
      fullPage: true,
    });

    // Play up to 12 exos (10 + safety buffer for retries)
    const results: string[] = [];
    for (let i = 1; i <= 15; i++) {
      const body = (await page.textContent("body")) ?? "";
      if (body.includes("Palier validé") || body.includes("Palier non validé")) {
        console.log(`Palier ended at iteration ${i}`);
        break;
      }
      const r = await playOneExercise(page, i);
      results.push(r);
      console.log(`Exo ${i}: ${r}`);
    }

    // Capture final state
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: ".context/screenshots/play-99-palier-end.png",
      fullPage: true,
    });

    const finalBody = (await page.textContent("body")) ?? "";
    console.log("Final results:", results);
    console.log("Palier ended:", finalBody.slice(0, 300));

    // Verify we reached an end state
    expect(
      finalBody.includes("Palier validé") || finalBody.includes("Palier non validé"),
    ).toBe(true);
  });
});

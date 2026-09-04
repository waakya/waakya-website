import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { signInAs, signOut, TEST_USERS } from "./support/auth";

/**
 * Proof of completion. The photo goes straight from the phone to private
 * storage through a URL the server signs; the app never handles the bytes, and
 * the object key never reaches the browser.
 */
test.describe.configure({ mode: "serial" });

/** A one-pixel PNG, which is a real image as far as everything here cares. */
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

async function createTaskNeedingProof(page: Page, title: string) {
  await page.goto("/naya");
  await page.getByRole("button", { name: /^Kisko/ }).click();
  await page.getByRole("button", { name: "Raju" }).click();
  await page.getByRole("button", { name: /^Kya/ }).click();
  await page.getByRole("textbox", { name: "Kya" }).fill(title);
  await page.getByRole("button", { name: "Save" }).click();
  // The Proof switch: the owner is asking for a photo.
  await page.getByRole("switch").click();
  await expect(page.getByText("Photo chahiye")).toBeVisible();
  await page.getByRole("button", { name: "Bhejo" }).click();
  await expect(page).toHaveURL(/\/aaj$/);
}

test("finishing a task that needs a photo asks for one first", async ({
  page,
  browser,
}) => {
  const title = `Photo kaam ${Date.now()}`;
  await signOut(page);
  await signInAs(page, "owner");
  await createTaskNeedingProof(page, title);

  const staffContext = await browser.newContext();
  const staff = await staffContext.newPage();
  await staff.request.post("/api/test-login", {
    data: { email: TEST_USERS.staff.email, password: TEST_USERS.staff.password },
  });

  await staff.goto("/aaj");
  await staff.getByText(title).click();
  // The row and the screen both say a photo is wanted, in words.
  await expect(staff.getByText("Photo chahiye").first()).toBeVisible();

  const trail = staff.getByRole("list", { name: "Timeline" });
  await staff.getByRole("button", { name: "Dekh liya, ho jayega" }).click();
  await expect(trail).toContainText("Maana");

  // "Ho gaya" opens the proof sheet rather than finishing the task.
  await staff.getByRole("button", { name: "Ho gaya" }).click();
  await expect(
    staff.getByRole("heading", { name: "Ho gaya? Proof bhejein" }),
  ).toBeVisible();
  // Nothing attached yet, so the task cannot be closed.
  await expect(
    staff.getByRole("button", { name: "Bhejein · ho gaya" }),
  ).toBeDisabled();
  // And there is no way to skip it, because the owner asked.
  await expect(
    staff.getByRole("button", { name: "Bina proof ke" }),
  ).toHaveCount(0);

  await staff.setInputFiles('input[type="file"]', {
    name: "kaam.png",
    mimeType: "image/png",
    buffer: PNG,
  });
  await expect(staff.getByText("1 photo")).toBeVisible();

  await staff.getByRole("button", { name: "Bhejein · ho gaya" }).click();
  await expect(trail).toContainText("Ho gaya");
  await staffContext.close();

  // The owner sees the proof, and only then verifies.
  await page.goto("/aaj");
  await page.getByText(title).click();
  await expect(
    page.getByRole("heading", { name: "Proof", exact: true }),
  ).toBeVisible();
  const photo = page.getByAltText("Raju ki bheji photo");
  await expect(photo).toBeVisible();

  // The link is signed and short-lived, not a public object key.
  const src = await photo.getAttribute("src");
  expect(src).toMatch(/token=|X-Amz-Signature=/);

  await page.getByRole("button", { name: "Verify karein" }).click();
  await expect(page.getByRole("list", { name: "Timeline" })).toContainText(
    "Verified",
  );
});

test("a task without a proof requirement can still be finished plainly", async ({
  page,
  browser,
}) => {
  const title = `NoProof ${Date.now()}`;
  await signOut(page);
  await signInAs(page, "owner");
  await page.goto("/naya");
  await page.getByRole("button", { name: /^Kisko/ }).click();
  await page.getByRole("button", { name: "Raju" }).click();
  await page.getByRole("button", { name: /^Kya/ }).click();
  await page.getByRole("textbox", { name: "Kya" }).fill(title);
  await page.getByRole("button", { name: "Save" }).click();
  await page.getByRole("button", { name: "Bhejo" }).click();
  // Wait for the send to land before another browser looks for it.
  await expect(page).toHaveURL(/\/aaj$/);
  await expect(page.getByText(title)).toBeVisible();

  const staffContext = await browser.newContext();
  const staff = await staffContext.newPage();
  await staff.request.post("/api/test-login", {
    data: { email: TEST_USERS.staff.email, password: TEST_USERS.staff.password },
  });
  await staff.goto("/aaj");
  await staff.getByText(title).click();
  const trail = staff.getByRole("list", { name: "Timeline" });
  await staff.getByRole("button", { name: "Dekh liya, ho jayega" }).click();
  await expect(trail).toContainText("Maana");
  await staff.getByRole("button", { name: "Ho gaya" }).click();

  // The sheet still offers the camera, but finishing without one is allowed.
  await staff.getByRole("button", { name: "Bina proof ke" }).click();
  await expect(trail).toContainText("Ho gaya");
  await staffContext.close();
});

test("the proof bucket is private and scoped to the org", async () => {
  const outsider = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  await outsider.auth.signInWithPassword({
    email: TEST_USERS.noorg.email,
    password: TEST_USERS.noorg.password,
  });

  // Somebody in no org can neither list nor read the bucket.
  const { data: listed } = await outsider.storage.from("proofs").list("orgs");
  expect(listed ?? []).toEqual([]);

  // And cannot write into somebody else's folder.
  const owner = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  await owner.auth.signInWithPassword({
    email: TEST_USERS.owner.email,
    password: TEST_USERS.owner.password,
  });
  const { data: orgs } = await owner.from("orgs").select("id");
  const orgId = orgs![0].id;

  const { error } = await outsider.storage
    .from("proofs")
    .upload(`orgs/${orgId}/tasks/${orgId}/sneak.png`, PNG, {
      contentType: "image/png",
    });
  expect(error).not.toBeNull();
});

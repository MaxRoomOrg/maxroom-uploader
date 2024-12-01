import type { Page } from "playwright-chromium";

export const Platform = {
  Youtube: "youtube",
  X: "x",
  Facebook: "facebook",
  TikTok: "tiktok",
} as const;

export type Platform = (typeof Platform)[keyof typeof Platform];

export async function uploadToYoutube(page: Page, videoPath: string) {
  try {
    // Go to youtube.com
    await page.goto("https://youtube.com/");

    const createButton = page.getByLabel("Create", { exact: true }); // We use { exact: true } to ensure that the label "Create" is matched exactly, without allowing partial matches.
    await createButton.click();

    // Once the "Create" button is clicked, finding the "Upload Video" button for click
    await page.getByText("Upload video").click();

    // Find the input element and upload the hardcoded video
    const fileInputElement = page.locator('input[type="file"]');
    await fileInputElement.setInputFiles(videoPath);

    // Find the "Next" button on the plublish dialog which opens when video is uploaded
    const nextButton = page.getByLabel("Next");

    // Select the default values to proceed for now

    // Find and Click the radio button with label ("Yes, it's made for kids") and click "Next"
    const kidsRadioButtonLabel = page.getByRole("radio", { name: "Yes, it's made for kids" });
    await kidsRadioButtonLabel.click();
    await nextButton.click();

    // The next two section are already filled with default value, so hit "Next" two times
    await nextButton.click();
    await nextButton.click();

    // Find and Click the radio button with label ("Public") and click "Publish" button
    const publicRadioButtonLabel = page.getByRole("radio", { name: "Public" });
    await publicRadioButtonLabel.click();
    const publishButton = page.getByLabel("Publish");
    await publishButton.click();

    // We have multiple buttons that look similar "Close" used for closing dialog box that opens after "Publish button is clicked".
    // To avoid ambiguity, we first target the parent
    // <ytcp-button> element, which can be uniquely identified, and then target the
    // child <button> with aria-label="Close" inside it.
    const closeButtonParent = page.locator("ytcp-button#close-button");
    const closeButton = closeButtonParent.getByRole("button", { name: "Close" });
    await closeButton.click();

    // TODO: Close the dialog box open and repeat the process frop line number 16 - 32 (for multiple video to plublish)
  } catch (error: unknown) {
    console.log(error);
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    return setTimeout(resolve, (1 + Math.random()) * ms);
  });
}

export async function uploadToX(page: Page, videoPaths: string[], delayBetweenPosts = 5000) {
  try {
    await page.goto("https://x.com/");

    // Wait for the user to sign in and the "Add photos or video" button to appear
    await page.getByRole("button", { name: "Add photos or video" }).waitFor({ state: "visible" });

    for (const videoPath of videoPaths) {
      try {
        // Click the "Add photos or video" button
        const createButton = page.getByRole("button", { name: "Add photos or video" });
        await createButton.click();

        // Find the input element and upload the video
        const fileInputElement = page.getByTestId("fileInput");
        await fileInputElement.setInputFiles(videoPath);

        // Wait for the 'Post' button to appear and click it
        const publishButton = page.getByTestId("tweetButtonInline");
        await publishButton.waitFor({ state: "visible" });
        await publishButton.click();
        await sleep(delayBetweenPosts); // Adding a delay to avoid being flagged for spamming or overwhelming the platform with rapid uploads.
      } catch (err) {
        console.log(err);
      }
    }
  } catch (error) {
    console.error("An error occurred while uploading videos:", error);
  }
}

export async function uploadToTiktok(page: Page, videoPath: string) {
  try {
    await page.goto("https://www.tiktok.com/tiktokstudio/upload?lang=en");

    // Wait for the user to sign in and locate the file input element and append video to it
    const fileInputElement = page.locator('input[type="file"]');
    await fileInputElement.setInputFiles(videoPath);
    // Using "timeout: 0" to prevent timeout error if a video of a larger size needs to be uploaded, 0 sets Timeout to infinity.
    // We use { exact: true } to ensure that the label "Uploaded" is matched exactly, without allowing partial matches.
    await page.getByAltText("Uploaded", { exact: true }).waitFor({ state: "visible", timeout: 0 });
    // Ref: https://playwright.dev/docs/api/class-framelocator#frame-locator-get-by-role
    // Click on button with name "Post"
    await page.getByRole("button", { name: "Post" }).click();
    // Click on button with name "Upload" to upload the Post
    await page.getByRole("button", { name: "Upload" }).click();
  } catch (error: unknown) {
    console.error(error);
  }
}

export async function uploadToFacebook(page: Page, videoPath: string) {
  try {
    await page.goto("https://www.facebook.com/");
    // Find and click the "What's on your mind" button
    const postButton = page.getByRole("button", { name: /what's on your mind/i }).first();
    await postButton.click();
    // Wait for the post creation dialog to open
    await page.waitForSelector('div[role="dialog"]', { timeout: 30000 });
    // Find and click the "Video" button in the dialog
    const videoButton = page.getByRole("button", { name: /video/i }).first();
    await videoButton.click();
    // Find the input element and upload video
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(videoPath);
    // Find and click the Post button
    const finalPostButton = page.getByRole("button", { name: /post|share/i }).last();
    // Add a small delay to ensure everything is ready
    await page.waitForTimeout(2000);
    await finalPostButton.click();
    // Wait for post confirmation
    await page.waitForSelector('div[aria-label="Post"]', { timeout: 30000 });
  } catch (error) {
    console.error("Error uploading to Facebook:", error);
  }
}

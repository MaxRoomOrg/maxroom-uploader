import { Platform } from "../utils";
import type { VideoDetails } from "../schemas";
import type { BrowserContext } from "playwright-chromium";

/**
 * Closes the "about:blank" page if it exists in the given browser context.
 *
 * This function should be called for every upload service to ensure any lingering
 * blank page ("about:blank") is closed after navigating to the social platform's URL.
 *
 * Important:
 * - This function must be called only after the social platform's page has navigated to its respective URL (eg. www.youtube.com).
 * - If called before navigation, the page for the social platform (which starts as "about:blank") can get prematurely closed,
 *   causing unintended behavior.
 *
 * @param {BrowserContext} context - The browser context in which the pages are managed.
 */
async function closeBlankPage(context: BrowserContext) {
  const pages = context.pages();
  // index === 0 , because the blank page opens in first tab
  if (pages.length > 0 && pages[0].url() === "about:blank") {
    await pages[0].close();
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    return setTimeout(resolve, (1 + Math.random()) * ms);
  });
}

async function uploadToYoutube(context: BrowserContext, videos: VideoDetails[], delayBetweenPosts = 5000) {
  const page = await context.newPage();

  try {
    // Go to youtube.com
    await page.goto("https://youtube.com/");
    await closeBlankPage(context);
    for (const video of videos) {
      const createButton = page.getByLabel("Create", { exact: true }); // We use { exact: true } to ensure that the label "Create" is matched exactly, without allowing partial matches.
      await createButton.click();

      // Once the "Create" button is clicked, finding the "Upload Video" button for click
      await page.getByText("Upload video").click();

      // Find the input element and upload the hardcoded video
      const fileInputElement = page.locator('input[type="file"]');
      await fileInputElement.setInputFiles(video.video);

      // Find the "Next" button on the plublish dialog which opens when video is uploaded
      const nextButton = page.getByLabel("Next");

      // Adding Values like title, description, thumbnail, url.
      const { title, description, image, url } = video;

      // Create Locators for title, description, image
      const titleLocator = page.getByLabel("Add a title that describes your video (type @ to mention a channel)", {
        exact: true,
      });
      const descriptionLocator = page.getByLabel("Tell viewers about your video (type @ to mention a channel)", {
        exact: true,
      });
      const thumbnailButton = page.getByText("Upload file", { exact: true });

      // Set the listener(for uploading image for thumbnail via fileChooser) before clicking the button to avoid race condition where the listener could miss the event if it was set after the click.
      page.on("filechooser", async (fileChooser) => {
        // Set the file for upload
        if (typeof image === "string") {
          await fileChooser.setFiles(image);
        }
      });

      // Fill values
      if (title.length > 0) {
        await titleLocator.fill(title);
      }

      const youtubeDescription = typeof description === "string" ? `${description} ${url ?? ""}` : url;
      if (typeof youtubeDescription === "string") {
        await descriptionLocator.fill(youtubeDescription);
      }

      // Click on Upload file button to open file chooser for uploading image
      await thumbnailButton.click();

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
      await sleep(delayBetweenPosts); // Adding a delay to avoid being flagged for spamming or overwhelming the platform with rapid uploads.
    }
  } catch (error: unknown) {
    console.log(error);
  }
}

async function uploadToX(context: BrowserContext, videos: VideoDetails[], delayBetweenPosts = 5000) {
  const page = await context.newPage();

  try {
    await page.goto("https://x.com/");
    await closeBlankPage(context);

    // Wait for the user to sign in and the "Add photos or video" button to appear
    await page.getByRole("button", { name: "Add photos or video" }).waitFor({ state: "visible" });

    for (const video of videos) {
      try {
        // Click the "Add photos or video" button
        const createButton = page.getByRole("button", { name: "Add photos or video" });
        await createButton.click();

        // Find the input element and upload the video
        const fileInputElement = page.getByTestId("fileInput");
        await fileInputElement.setInputFiles(video.video);

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

async function uploadToInstagram(context: BrowserContext, videos: VideoDetails[], delayBetweenPosts = 5000) {
  const page = await context.newPage();

  try {
    // Navigate to Instagram homepage
    await page.goto("https://www.instagram.com/");
    await closeBlankPage(context);

    for (const video of videos) {
      // Wait for the user to be signed in and the "New post" button to appear
      const newPostButton = page.getByRole("img", { name: "New post", exact: true });
      await newPostButton.waitFor({ state: "visible", timeout: 0 });

      // Click on the "New post" button
      await newPostButton.click();

      // Wait for the "Post" button to be visible and click it
      const filePostButton = page.getByRole("img", { name: "Post", exact: true });
      const filePostButtonVisible = await filePostButton.isVisible();
      // After we click "newPostButton" the "filePostButton" may or may not occur for some instagram account. For some account the "newPostButton" itself opens the dialog box for video upload.
      if (filePostButtonVisible === true) {
        await filePostButton.click();
      }

      // Wait for the file input to appear and upload the video
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(video.video);

      // Wait for the first "Next" button to appear and click it
      // This is the initial "Next" button in the posting flow, which transitions the user to the next step (i.e. cropping)
      const nextButton = page.getByRole("button", { name: "Next", exact: true });
      await nextButton.waitFor({ state: "visible", timeout: 0 });
      await nextButton.click();

      // Add image as thumbnail
      await fileInput.setInputFiles(video.image ?? "");

      // Wait for the second "Next" button to appear and click it
      // This "Next" button appears on the final review screen ( where edits or adjustments can be made ).
      // To differentiate it from the first "Next" button, we locate it using the parent dialog element with the aria-label "Edit".
      // This ensures precision and avoids unintended interactions with identical buttons elsewhere on the page.
      const finalNextButton = page
        .getByRole("dialog", { name: "Edit", exact: true }) // Target the parent dialog with the specific name "Edit"
        .getByRole("button", { name: "Next", exact: true }); // Locate the "Next" button inside the targeted dialog
      await finalNextButton.click();

      // Adding Values like title, description, url.
      const { title, description, url } = video;
      const content = page.getByLabel("Write a caption...", { exact: true });
      const text = `${title}\n${description ?? ""}\n${url ?? ""}`.trim();
      await content.fill(text);

      // Wait for the "Share" button to appear and click it
      const shareButton = page.getByRole("button", { name: "Share", exact: true });
      await shareButton.waitFor({ state: "visible", timeout: 0 });
      await shareButton.click();

      const imgElement = page.getByAltText("Animated checkmark");
      await imgElement.waitFor({ state: "visible", timeout: 0 }); // wait for the upload confirmation of the post

      const exitButton = page.getByRole("img", { name: "Close", exact: true });
      await exitButton.waitFor({ state: "visible", timeout: 0 });
      await exitButton.click();
      await sleep(delayBetweenPosts);
    }
  } catch (err) {
    console.log(`Failed to upload video:`, err);
  }
}

async function uploadToLinkedIn(context: BrowserContext, videos: VideoDetails[], delayBetweenPosts = 5000) {
  const page = await context.newPage();

  try {
    // Navigate to LinkedIn homepage
    await page.goto("https://www.linkedin.com/feed/");
    await closeBlankPage(context);

    for (const video of videos) {
      // Wait for the "Add a video" button to be visible on the page and initiates the video upload process
      const videoButton = page.getByLabel("Add a video");
      await videoButton.waitFor({ state: "visible", timeout: 0 });

      // Set the listener before clicking the button to avoid race condition where the listener could miss the event if it was set after the click.
      page.on("filechooser", async (fileChooser) => {
        // Set the file for upload
        await fileChooser.setFiles(video.video);
      });

      // Now click the "Add a video" button
      await videoButton.click();

      // Add image as thumbnail
      const thumbnail = page.getByRole("button", { name: "Video thumbnail" });
      const fileInputElement = page.locator('input[type="file"]');
      const addImageButton = page.getByRole("button", { name: "Add" });

      await thumbnail.click();
      await fileInputElement.setInputFiles(video.image ?? "");
      await addImageButton.click();

      // Wait for the "Next" button to appear and be visible on the page
      const nextButton = page.getByRole("button", { name: "Next", exact: true });
      await nextButton.waitFor({ state: "visible" });

      // Click the "Next" button to confirm and proceed
      await nextButton.click();

      // Adding Values like title, description, url.
      const { title, description, url } = video;
      const editor = page.getByRole("textbox", { name: "Text editor for creating" });
      const text = `${title}\n${description ?? ""}\n${url ?? ""}`.trim(); // using trim() helps to remove empty lines if either of the values are missing
      await editor.fill(text);

      // Wait for the "Post" button to appear and be visible on the page, finalizes and publishes the post with the uploaded video.
      const postButton = page.getByRole("button", { name: "Post", exact: true });
      await postButton.waitFor({ state: "visible" });

      // Click the "Post" button to publish the video
      await postButton.click();

      //Wait For the Post to Upload
      const processingTextLocator = page.getByText("Upload complete. We’ll notify you when your post is ready.");
      await processingTextLocator.waitFor({ state: "visible", timeout: 0 });
      await sleep(delayBetweenPosts);
    }
  } catch (err) {
    console.log(err);
  }
}

async function uploadToTiktok(context: BrowserContext, videos: VideoDetails[], delayBetweenPosts = 5000) {
  const page = await context.newPage();

  try {
    await page.goto("https://www.tiktok.com/tiktokstudio/upload?lang=en");
    await closeBlankPage(context);

    // Wait for the user to sign in and locate the file input element and append video to it
    for (const video of videos) {
      const fileInputElement = page.locator('input[type="file"]');
      await fileInputElement.setInputFiles(video.video);

      // Adding Values like title, description, url.
      const { title, description, url } = video;

      // Create Locators
      const editor = page.locator('div[role="combobox"][contenteditable="true"]');

      // fill values
      const text = `${title}\n${description ?? ""}\n${url ?? ""}`.trim(); // using trim() helps to remove empty lines if either of the values are missing
      await editor.click(); // To write into contentediable "div" we first have to focus on it by clicking it.
      await editor.clear(); // Tiktok itself puts the video name in the editor, hence first clear it and then fill text.
      await editor.fill(text);

      // Using "timeout: 0" to prevent timeout error if a video of a larger size needs to be uploaded, 0 sets Timeout to infinity.
      // We use { exact: true } to ensure that the label "Uploaded" is matched exactly, without allowing partial matches.
      await page.getByAltText("Uploaded", { exact: true }).waitFor({ state: "visible", timeout: 0 });
      // Ref: https://playwright.dev/docs/api/class-framelocator#frame-locator-get-by-role
      // Click on button with name "Post"
      await page.getByRole("button", { name: "Post" }).click();
      // Click on button with name "Upload" to upload the Post
      await page.getByRole("button", { name: "Upload" }).click();
      await sleep(delayBetweenPosts); // Adding a delay to avoid being flagged for spamming or overwhelming the platform with rapid uploads.
    }
  } catch (error: unknown) {
    console.error(error);
  }
}

async function uploadToFacebook(context: BrowserContext, videos: VideoDetails[], delayBetweenPosts = 5000) {
  const page = await context.newPage();

  try {
    await page.goto("https://www.facebook.com/");
    await closeBlankPage(context);

    for (const video of videos) {
      // Find and click "Photo/vidoe" button
      const uploadButton = page.getByRole("button", { name: "Photo/video" });
      // Wait for "Photo/video" button to come on screen, as the user must be signin into Facebook.
      await uploadButton.waitFor({ state: "visible", timeout: 0 });
      // Once the "Upload" Button in found, click to upload the video"
      await uploadButton.click();

      // Find the input element and upload video
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles([video.video, video.image ?? ""]); // In Facebook, there is single input box for both image and video and the mutiple property is set to true.

      // Adding Values like title, description, url.
      const { title, description, url } = video;
      const content = page.getByLabel("What's on your mind", { exact: false }); // exact: false is used for partial match as the Label can vary user-to-user (e.g. What's on your mind, {Username})
      const text = `${title}\n${description ?? ""}\n${url ?? ""}`.trim();
      await content.fill(text);

      // Find and click the "Post" button.
      const postButton = page.getByRole("button", { name: "Post", exact: true });
      await postButton.click();

      // When we click on "Post" button a loader is visible with text "Posting", hence waiting for it to get detach from dom.
      await page.getByText("Posting").waitFor({ state: "detached", timeout: 0 });
      await sleep(delayBetweenPosts); // Adding a delay to avoid being flagged for spamming or overwhelming the platform with rapid uploads.
    }
  } catch (error) {
    console.error(error);
  }
}

async function uploadToPinterest(context: BrowserContext, videos: VideoDetails[], delayBetweenPosts = 5000) {
  const page = await context.newPage();
  try {
    // Wait for the user to sign in and navigate to the create Tab
    await page.goto("https://www.pinterest.com/pin-creation-tool/");
    await closeBlankPage(context);
    for (const video of videos) {
      // Locate the file input element and append video to it
      const fileInputElement = page.locator('input[type="file"]');
      await fileInputElement.setInputFiles(video.video);
      // Wait for the text "Changes Stored!" to appear and then click on the publish button.
      // Using "timeout: 0" to prevent timeout error if a video of a larger size needs to be uploaded, 0 sets Timeout to infinity.
      await page.getByText("Changes stored!", { exact: true }).waitFor({ state: "visible", timeout: 0 });
      // We don't need state: "visible" here because in pinterest , the publish button is visible from the very beginning.
      await page.getByRole("button", { name: "Publish" }).click();
      // When we click "Publish" button, the button text changes to "Publishing". So, to upload mutliple videos we need the Publish button ready again.
      await page.getByRole("button", { name: "Publish" }).waitFor({ state: "visible", timeout: 0 });
      await sleep(delayBetweenPosts); // Adding a delay to avoid being flagged for spamming or overwhelming the platform with rapid uploads.
    }
  } catch (error: unknown) {
    console.error(error);
  }
}

async function uploadToThreads(context: BrowserContext, videos: VideoDetails[], delayBetweenPosts = 5000) {
  const page = await context.newPage();
  try {
    // Wait for the user to sign in and navigate to home page
    // Wait for the user to sign in and navigate to home page
    await page.goto("https://www.threads.net/");
    await closeBlankPage(context);
    for (const video of videos) {
      // locate and click the Post button to make the upload modal open
      const createButton = page.getByRole("button", { name: "Post", exact: true });
      await createButton.waitFor({ state: "visible", timeout: 0 });
      await createButton.click();

      // locate the file input element and append video to it
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(video.video);

      // Adding Values like title, description.
      const { title, description, url } = video;
      const editor = page.getByRole("textbox");
      const text = `${title}\n${description ?? ""}\n${url ?? ""}`.trim();
      await editor.fill(text);

      // Get the "Post" button and click to post the video.
      const postButton = page.getByRole("button", { name: "Post", exact: true });
      await postButton.waitFor({ state: "visible", timeout: 0 });
      await postButton.click();
      // Waiting for "Role: Alert" to get attached to the DOM.
      await page.getByRole("alert").waitFor({ state: "attached" });
      // Waiting for "Role: Alert" to get Detached from the DOM. This ensures that the video posting is complete.
      await page.getByRole("alert").waitFor({ state: "detached", timeout: 0 });
      await sleep(delayBetweenPosts); // Adding a delay to avoid being flagged for spamming or overwhelming the platform with rapid uploads.
    }
  } catch (error: unknown) {
    console.error(error);
  }
}

export const PlatformHandlers: Record<
  Platform,
  (context: BrowserContext, videos: VideoDetails[], delayBetweenPosts?: number) => Promise<void>
> = {
  [Platform.Youtube]: uploadToYoutube,
  [Platform.Facebook]: uploadToFacebook,
  [Platform.Instagram]: uploadToInstagram,
  [Platform.LinkedIn]: uploadToLinkedIn,
  [Platform.Threads]: uploadToThreads,
  [Platform.TikTok]: uploadToTiktok,
  [Platform.Pinterest]: uploadToPinterest,
  [Platform.X]: uploadToX,
};

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

function trimText(str: string, maxLength: number) {
  return str.length > maxLength ? str.slice(0, maxLength) : str;
}

async function uploadToYoutube(context: BrowserContext, videos: VideoDetails[], delayBetweenPosts = 5000) {
  const page = await context.newPage();

  try {
    // Go to youtube.com
    await page.goto("https://youtube.com/");
    await closeBlankPage(context);
    for (const video of videos) {
      const createButton = page.getByLabel("Create", { exact: true }); // We use { exact: true } to ensure that the label "Create" is matched exactly, without allowing partial matches.
      await createButton.click({ timeout: 0 });

      // Once the "Create" button is clicked, finding the "Upload Video" button for click
      await page.getByText("Upload video").click();

      // Find the input element and upload the hardcoded video
      const fileInputElement = page.locator('input[type="file"]');
      await fileInputElement.setInputFiles(video.video);

      // Find the "Next" button on the plublish dialog which opens when video is uploaded
      const nextButton = page.getByRole("dialog").getByLabel("Next");

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

      // Fill values
      if (title.length > 0) {
        await titleLocator.fill(title);
      }

      const youtubeDescription = typeof description === "string" ? `${description} ${url ?? ""}` : url;
      if (typeof youtubeDescription === "string") {
        const text = trimText(youtubeDescription, 5000); // Youtube description has limit the description lenght to 5000 characters.
        await descriptionLocator.fill(text);
      }

      // Check if thumbnail option is available or not, as it depends on video lenght we are uploading
      const isThumbnailOptionVisible = await thumbnailButton.isVisible();
      if (isThumbnailOptionVisible === true) {
        // Set the listener(for uploading image for thumbnail via fileChooser) before clicking the button to avoid race condition where the listener could miss the event if it was set after the click.
        page.on("filechooser", async (fileChooser) => {
          // Set the file for upload
          if (typeof image === "string") {
            await fileChooser.setFiles(image);
          }
        });

        // Click on Upload file button to open file chooser for uploading image
        await thumbnailButton.click();
      }

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
    await page.close();
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
    await page.getByRole("button", { name: "Add photos or video" }).waitFor({ state: "visible", timeout: 0 });

    for (const video of videos) {
      // Find the input element and upload the video
      const fileInputElement = page.getByTestId("fileInput");
      await fileInputElement.setInputFiles(video.video);

      // Wait for the video upload process to start. This is indicated by a UI change where a suggestion to add subtitles becomes visible.
      await page.getByTestId("addSubtitlesLabel").waitFor({ state: "visible", timeout: 0 });

      // Adding Values like title, description.
      const { title, description, url } = video;
      const content = page.getByLabel("Post text", { exact: true });
      const text = `${title}\n${description}`.trim();
      const postText = trimText(text, 280); // X has limit the post lenght to 280 character.
      await content.fill(postText);

      // Wait for the 'Post' button to appear and click it.
      const publishButton = page.getByTestId("tweetButtonInline");
      await publishButton.click({ timeout: 0 }); // Timeout: 0 is added to wait for the button to be visible and enabled to click.

      if (typeof url === "string" && url.length > 0) {
        // Use a robust method to add the URL as the first comment to the newly created post.
        // Locate the post using the same text that was just posted and click on it, this will navigate us to newly created post.
        const createdPost = page.getByText(postText, { exact: true });
        await createdPost.click({ timeout: 0 }); // Timeout: 0 is added to wait for the newly created post to be visible and then click it.

        // Wait for the content to load to ensure the DOM is fully ready before interacting with elements.
        // This prevents mistakenly selecting the textbox (with label Post text) from the homepage while the new page is still loading.
        await page.waitForLoadState("domcontentloaded");
        const replyBox = page.getByLabel("Post text");
        await replyBox.fill(url);

        // Add the url as first comment
        const postComment = page.getByTestId("tweetButtonInline");
        await postComment.click();

        // Redirect to home page again for further Posting.
        await page.goto("https://x.com/home");
      }

      await sleep(delayBetweenPosts); // Adding a delay to avoid being flagged for spamming or overwhelming the platform with rapid uploads.
    }
    await page.close();
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
      await newPostButton.click({ timeout: 0 }); // Timeout: 0 is added to wait for the button to be visible and enabled to click.

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
      await nextButton.click({ timeout: 0 }); // Timeout: 0 is added to wait for the button to be visible and enabled to click.

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
      const text = `${title}\n${description}\n${url ?? ""}`.trim();
      await content.fill(text);

      // Wait for the "Share" button to appear and click it
      const shareButton = page.getByRole("button", { name: "Share", exact: true });
      await shareButton.click({ timeout: 0 }); // Timeout: 0 is added to wait for the button to be visible and enabled to click.

      const imgElement = page.getByAltText("Animated checkmark");
      await imgElement.waitFor({ state: "visible", timeout: 0 }); // wait for the upload confirmation of the post

      const exitButton = page.getByRole("img", { name: "Close", exact: true });
      await exitButton.click({ timeout: 0 }); // Timeout: 0 is added to wait for the button to be visible and enabled to click.
      await sleep(delayBetweenPosts);
    }
    await page.close();
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
      const videoButton = page.getByLabel("Add media");

      // Set the listener before clicking the button to avoid race condition where the listener could miss the event if it was set after the click.
      page.on("filechooser", async (fileChooser) => {
        // Set the file for upload
        await fileChooser.setFiles(video.video);
      });

      // Wait for the "Add a video" button to be visible and click and initiates the video upload process
      await videoButton.click({ timeout: 0 }); // Timeout: 0 is added to wait for the button to be visible and enabled to click.

      // Add image as thumbnail
      const thumbnail = page.getByRole("button", { name: "Video thumbnail" });
      const fileInputElement = page.locator('input[type="file"]');
      const addImageButton = page.getByRole("button", { name: "Add" });

      await thumbnail.click();
      await fileInputElement.setInputFiles(video.image ?? "");
      await addImageButton.click();

      // Wait for the "Next" button to appear and be visible on the page and then click
      const nextButton = page.getByRole("button", { name: "Next", exact: true });
      await nextButton.click({ timeout: 0 }); // Timeout: 0 is added to wait for the button to be visible and enabled to click.

      // Adding Values like title, description, url.
      const { title, description, url } = video;
      const editor = page.getByRole("textbox", { name: "Text editor for creating" });
      const text = `${title}\n${description}\n${url ?? ""}`.trim(); // using trim() helps to remove empty lines if either of the values are missing
      await editor.fill(text);

      // Wait for the "Post" button to appear and be visible on the page, finalizes and publishes the post with the uploaded video.
      const postButton = page.getByRole("button", { name: "Post", exact: true });
      await postButton.click({ timeout: 0 }); // Timeout: 0 is added to wait for the button to be visible and enabled to click.

      //Wait For the Post to Upload
      const processingTextLocator = page.getByText("Upload complete. We’ll notify you when your post is ready.");
      await processingTextLocator.waitFor({ state: "visible", timeout: 0 });
      await sleep(delayBetweenPosts);
    }
    await page.close();
  } catch (err) {
    console.log(err);
  }
}

async function uploadToSnapchat(context: BrowserContext, videos: VideoDetails[], delayBetweenPosts = 5000) {
  const page = await context.newPage();

  try {
    // Navigate to Snapchat website
    await page.goto("https://my.snapchat.com/");
    await closeBlankPage(context);

    for (const video of videos) {
      // Using page.on("filechooser") to handle file uploads because there are two input elements on the page
      // with the same functionality (single video upload). To ensure precision, we are specifically targeting
      // the "Choose media" button input for the file upload process.
      const chooseMediaButton = page.getByRole("button", { name: "Choose media", exact: true });

      // Set the listener before clicking the button to avoid race condition where the listener could miss the event if it was set after the click.
      page.on("filechooser", async (fileChooser) => {
        // Set the file for upload
        await fileChooser.setFiles(video.video);
      });

      await chooseMediaButton.click({ timeout: 0 }); // Using { timeout: 0 } to click until "Choose media" button is visible and enabled.

      // Check if the Profile selector is visible: for the first video upload, it becomes visible only after clicking the 'Post to Spotlight' button.
      // For subsequent uploads, it is already visible, and due to Snapchat UI inconsistencies, the 'Post to Spotlight' button must be clicked twice.
      const isProfileSelectorVisible = await page
        .locator('[id="__next"]')
        .getByText("Profile", { exact: true })
        .isVisible();

      // CONDITIONAL BLOCK: Handle clicks on the 'Post to Spotlight' button based on Profile Selector visibility
      if (isProfileSelectorVisible === false) {
        // First time clicking - Use the original locator for 'Post to Spotlight' button
        const spotlightButton = page.getByText("Post to Spotlight");
        await spotlightButton.click({ timeout: 0 }); // Using { timeout: 0 } to click until "Post to Spotlight" button is visible and enabled.
      } else {
        // Subsequent clicks - Use a different locator for the 'Post to Spotlight' button
        const spotlightButtonNew = page.locator('[id="__next"]').getByText("Post to Spotlight");
        await spotlightButtonNew.dblclick({ timeout: 0 }); // Using { timeout: 0 } to click until "Post to Spotlight" button is visible and enabled.
      }

      // Handle the case where the "Agree to Spotlight Terms" button is visible
      const agreeTermsButton = page.getByText("Agree to Spotlight Terms");
      const acceptTermsButton = page.getByRole("button", { name: "Accept", exact: true });
      const isAgreeTermsButtonVisible = await agreeTermsButton.isVisible();
      if (isAgreeTermsButtonVisible === true) {
        await agreeTermsButton.click();
        await acceptTermsButton.click({ timeout: 0 });
      }

      // Adding Values like title, description, url.
      const { title, description, url } = video;
      const content = page.getByPlaceholder("Add a description and #topics", { exact: true });
      const text = `${title}\n${description}\n${url ?? ""}`.trim();
      const postText = trimText(text, 160); // Snapchat has limit the post lenght to 160 character.
      await content.fill(postText);

      // Wait infinitely for the button to become clickable because sometimes a captcha appears, and we need to wait until it is solved
      const postButton = page.getByRole("button", { name: "Post to Snapchat", exact: true });
      await postButton.click({ timeout: 0 }); // Using { timeout: 0 } to click until "Post to Snapchat" button is visible and enabled.

      // Close the confirmation popup after video is posted
      const confirmationCloseButton = page.getByRole("button", { name: "Close", exact: true });
      await confirmationCloseButton.click({ timeout: 0 }); // Using { timeout: 0 } to click until "Close" button is visible and enabled.

      // Click the 'New Post' button to prepare for the next video.
      const newPostButton = page.getByRole("button", { name: "New Post", exact: true });
      await newPostButton.click({ timeout: 0 }); // Using { timeout: 0 } to click until "Next Post" button is visible and enabled.

      await sleep(delayBetweenPosts); // Adding a delay to avoid being flagged for spamming or overwhelming the platform with rapid uploads.
    }
    await page.close();
  } catch (error) {
    console.log(error);
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
      await fileInputElement.setInputFiles(video.video, { timeout: 0 });

      // Adding Values like title, description, url.
      const { title, description, url } = video;

      // Create Locators
      const editor = page.locator('div[role="combobox"][contenteditable="true"]');

      // fill values
      const text = `${title}\n${description}\n${url ?? ""}`.trim(); // using trim() helps to remove empty lines if either of the values are missing
      await editor.click(); // To write into contentediable "div" we first have to focus on it by clicking it.
      await editor.clear(); // Tiktok itself puts the video name in the editor, hence first clear it and then fill text.
      const postText = trimText(text, 4000); // Tiktok description has limit the description lenght to 4000 characters.
      await editor.fill(postText);

      // Ref: https://playwright.dev/docs/api/class-framelocator#frame-locator-get-by-role
      // {Timeout: 0 } is used as we wait for the "Post" button to become enabled until the video gets uploaded and then click on it.
      await page.getByRole("button", { name: "Post", exact: true }).click({ timeout: 0 });
      // Click on button with name "Upload" to upload the Post
      await page.getByRole("button", { name: "Upload" }).click();
      await sleep(delayBetweenPosts); // Adding a delay to avoid being flagged for spamming or overwhelming the platform with rapid uploads.
    }
    await page.close();
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
      await fileInput.setInputFiles(video.video);

      // Adding Values like title, description, url.
      const { title, description, url } = video;
      const content = page.getByLabel("What's on your mind", { exact: false }); // exact: false is used for partial match as the Label can vary user-to-user (e.g. What's on your mind, {Username})
      const text = `${title}\n${description}\n${url ?? ""}`.trim();
      await content.fill(text);

      // Find and click the "Post" button.
      const postButton = page.getByRole("button", { name: "Post", exact: true });
      await postButton.click();

      // When we click on "Post" button a loader is visible with text "Posting", hence waiting for it to get detach from dom.
      await page.getByText("Posting").waitFor({ state: "detached", timeout: 0 });
      await sleep(delayBetweenPosts); // Adding a delay to avoid being flagged for spamming or overwhelming the platform with rapid uploads.
    }
    await page.close();
  } catch (error) {
    console.error(error);
  }
}

async function uploadToPinterest(context: BrowserContext, videos: VideoDetails[], delayBetweenPosts = 5000) {
  const page = await context.newPage();
  try {
    // Wait for the user to sign in and then navigate to the create page.
    await page.goto("https://www.pinterest.com/");
    await closeBlankPage(context);
    const createButton = page.getByRole("link", { name: "Create" });
    await createButton.click({ timeout: 0 });

    for (const video of videos) {
      // Locate the file input element and append video to it
      const fileInputElement = page.locator('input[type="file"]');
      await fileInputElement.setInputFiles(video.video);

      // Please note that the title, description and other fields gets enable to fill with text after the video is selected.
      // Adding values like title, description, link
      const { title, description, url } = video;
      const titleLocator = page.getByPlaceholder("Add a title", { exact: true });
      const descriptionLocator = page.locator('[data-test-id="editor-with-mentions"]');
      const linkLocator = page.getByPlaceholder("Add a link", { exact: true });

      // Fill values
      await titleLocator.fill(title);
      // The description box is a div with contenteditable true, so first click on it to focus, and then insert the description
      await descriptionLocator.click();
      await page.keyboard.insertText(description);
      if (typeof url === "string") {
        await linkLocator.fill(url);
        await page.getByRole("button", { name: "Publish" }).click(); // When we click on "Publish" button, URL verification starts, once it is end we again click "Publish" button.
      }

      // As soon as the text "Saving..." comes click "Publish" button and don't wait for saving.
      // Using "timeout: 0" to prevent timeout error if a video of a larger size needs to be uploaded, 0 sets Timeout to infinity.
      await page.getByText("Saving...", { exact: true }).waitFor({ state: "visible", timeout: 0 });
      // We don't need state: "visible" here because in pinterest , the publish button is visible from the very beginning.
      await page.getByRole("button", { name: "Publish" }).click();
      // wait for completion of publish before moving to upload next video or close the browser otherwise it will save as draft.
      await page.getByText("Your Pin has been published!").waitFor({ state: "visible", timeout: 0 });
      await sleep(delayBetweenPosts); // Adding a delay to avoid being flagged for spamming or overwhelming the platform with rapid uploads.
    }
    await page.close();
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
      await createButton.click({ timeout: 0 }); // Timeout: 0 is added to wait for the button to be visible and enabled to click.

      // locate the file input element and append video to it
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(video.video);

      // A Button with text "Alt" appears on top of video when the video is attached completely. This ensure the video is completely upload before posting.
      await page.getByRole("button", { name: "Alt" }).waitFor({ state: "visible", timeout: 0 });

      // Adding Values like title, description.
      const { title, description, url } = video;
      const editor = page.getByRole("textbox");
      const text = `${title}\n${description}\n${url ?? ""}`.trim();
      await editor.fill(text);

      // Get the "Post" button and click to post the video.
      const postButton = page.getByRole("button", { name: "Post", exact: true });
      await postButton.click({ timeout: 0 }); // Timeout: 0 is added to wait for the button to be visible and enabled to click.
      // Waiting for "Role: Alert" to get attached to the DOM.
      await page.getByRole("alert").waitFor({ state: "attached" });
      // Waiting for "Role: Alert" to get Detached from the DOM. This ensures that the video posting is complete.
      await page.getByRole("alert").waitFor({ state: "detached", timeout: 0 });
      await sleep(delayBetweenPosts); // Adding a delay to avoid being flagged for spamming or overwhelming the platform with rapid uploads.
    }
    await page.close();
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
  [Platform.Snapchat]: uploadToSnapchat,
};

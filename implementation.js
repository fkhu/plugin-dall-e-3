async function createOpenAIURL(prompt, openaikey, quality, resolution) {
  var requestHeaders = new Headers();
  requestHeaders.append('Content-Type', 'application/json');
  requestHeaders.append('Authorization', 'Bearer ' + openaikey);

  var raw = JSON.stringify({
    model: 'dall-e-3',
    prompt: prompt,
    n: 1,
    size: resolution,
    quality: quality,
    response_format: 'url',
  });

  var requestOptions = {
    method: 'POST',
    headers: requestHeaders,
    body: raw,
    redirect: 'follow',
  };

  let response = await fetch(
    'https://api.openai.com/v1/images/generations',
    requestOptions
  );
  if (response.status === 401) {
    throw new Error('Invalid OpenAI API Key. Please check your settings.');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  let data = await response.json();

  let url = data.data[0].url;

  let endresult = '![' + prompt.replace(/[[]]/, '') + '](' + url + ')';
  return endresult;
}

async function generateOpenAIResult(prompts, openaikey, quality, resolution) {
  const results = await Promise.all(
    prompts.map((prompt) =>
      createOpenAIURL(prompt, openaikey, quality, resolution)
    )
  );
  return (
    results.join('\n\n') +
    '\n_Note: Generated images will expire after 1 hour. Save them to your device if you wish to keep the images._'
  );
}

async function image_generation_via_dalle_3(params, userSettings) {
  const openaikey = userSettings.openaikey;
  const quality = getQuality(userSettings);
  const resolution = getResolution(userSettings);
  if (!openaikey) {
    throw new Error(
      'No OpenAI key provided to the DALL-3 plugin. Please enter your OpenAI key in the plugin settings seperately and try again.'
    );
  }

  const prompts = [
    params.prompt1,
    params.prompt2,
    params.prompt3,
    params.prompt4,
  ].filter(Boolean);
  const result = await generateOpenAIResult(
    prompts,
    openaikey,
    quality,
    resolution
  );
  return result;
}

function getQuality(userSettings) {
  // Only return userSettings quality if valid
  if (!userSettings.quality) {
    return 'standard';
  }

  switch (userSettings.quality.toLowerCase()) {
    case 'hd':
      return 'hd';
    case 'standard':
      return 'standard';
    default:
      return 'standard';
  }
}

function getResolution(userSettings) {
  switch (userSettings.resolution) {
    case '1024x1024':
      return '1024x1024';
    case '1024x1792':
      return '1024x1792';
    case '1792x1024':
      return '1792x1024';
    default:
      return '1024x1024'; // default resolution
  }
}

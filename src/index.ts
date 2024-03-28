import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { html } from 'hono/html'
import type { FrameSignaturePacket } from './types'

const app = new Hono()

app.get('/', (c) => {
  const frameImage = `https://placehold.co/1920x1005?text=Hello+World`;
  const framePostUrl = c.req.url;

  return c.html(`
    <html lang="en">
      <head>
      <meta property="og:image" content="${frameImage}" />
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="${frameImage}" />
      <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
      <meta property="fc:frame:post_url" content="${framePostUrl}" />
      <meta property="fc:frame:button:1" content="Green" />
      <meta property="fc:frame:button:2" content="Purple" />
      <meta property="fc:frame:button:3" content="Red" />
      <meta property="fc:frame:button:4" content="Blue" />
        <title>Arweave Upload Frame!</title>
      </head>
      <body>
        <h1>Arweave Upload Frame!</h1>
        <span style="display: flex; flex-direction: column; gap: 10px; width: 30%">
        <input type="file" id="fileInput" onchange="handleFileChange(event)" />
        <img id="imagePreview" style="max-width: 100%; max-height: 300px; margin-top: 20px; display: none;">
        <button onclick="uploadFile()" style={{paddingBottom: 10px}}>Upload to Arweave</button>
        <div id="txPreview"></div>
        </span>
        <script src="https://unpkg.com/arweave/bundles/web.bundle.min.js"></script>
        <script>
        let selectedFile = null;
        let fileType = null;
        const arweave = Arweave.init({
          host: 'arweave.net',
          port: 443,
          protocol: 'https',
          timeout: 3000000
        });
        function handleFileChange(event) {
          const file = event.target.files[0];
          fileType = file.type;
          if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
              selectedFile = e.target.result;
              // Create an object URL for the file and update the image preview
              const imgObjectUrl = URL.createObjectURL(file);
              const preview = document.getElementById('imagePreview');
              preview.src = imgObjectUrl;
              preview.style.display = 'block'; // Make the image visible
            };
            reader.readAsArrayBuffer(file);
          }
        }

        async function uploadFile() {
          if (!selectedFile) {
            console.error('No file selected.');
            return;
          }
          try {
            const tx = await arweave.createTransaction({
              data: selectedFile
            });

            tx.addTag("Content-Type", fileType);
      
            await arweave.transactions.sign(tx, 'use_wallet');
      
            const res = await arweave.transactions.post(tx).then(console.log).catch(console.log);
            
            const txPreview = document.getElementById('txPreview');
            txPreview.innerHTML = '<a href="https://arweave.net/' + tx.id + '" target="_blank">' + 'https://arweave.net/' + tx.id + '</a>';
          }
          catch (message) {
            console.log('message with upload: ', message);
          }
        }
        </script>
      </body>
    </html>
  `);
});

app.post('/', async (c) => {
  try {
    const body = await c.req.json<FrameSignaturePacket>()
    const { buttonIndex, inputText } = body.untrustedData

    const backgroundColors = ['green', 'purple', 'red', 'blue']

    const imageText = encodeURIComponent(inputText || 'Hello World')
    const imageColor = backgroundColors[buttonIndex - 1] || 'white'

    const frameImage = `https://placehold.co/1920x1005/${imageColor}/white?text=${imageText}`
    const framePostUrl = c.req.url

    return c.html(html`
      <html lang="en">
        <head>
          <meta property="fc:frame" content="vNext" />
          <meta property="fc:frame:image" content="${frameImage}" />
          <meta property="fc:frame:image:aspect_ratio" content="1.91:1" />
          <meta property="fc:frame:post_url" content="${framePostUrl}" />
          <meta property="fc:frame:input:text" content="Enter a message" />
          <meta property="fc:frame:button:1" content="Green" />
          <meta property="fc:frame:button:2" content="Purple" />
          <meta property="fc:frame:button:3" content="Red" />
          <meta property="fc:frame:button:4" content="Blue" />
          <title>Farcaster Frames</title>
        </head>
      </html>
    `)
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Invalid request' }, 400)
  }
})

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
  fetch: app.fetch,
  port,
})

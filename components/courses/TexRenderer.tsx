import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

interface TexRendererProps {
  content: string; // HTML with LaTeX content (delimited by $ or $$)
  padding?: number;
}

/**
 * Affiche du HTML/LaTeX (KaTeX) dans une WebView. Le composant calcule sa
 * propre hauteur via `document.body.scrollHeight` posté par la WebView : sans
 * ça, `flex: 1` dans un ScrollView donne une hauteur de 0 et la leçon est
 * totalement invisible.
 */
export const TexRenderer: React.FC<TexRendererProps> = ({ content, padding = 20 }) => {
  const [height, setHeight] = useState<number | null>(null);

  // KaTeX integration via CDN in a local HTML template
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" onload="renderMathInElement(document.body);"></script>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          html, body { margin: 0; padding: 0; }
          body {
            font-family: 'Poppins', sans-serif;
            font-size: 15px;
            color: #1A2027;
            line-height: 1.6;
            padding: ${padding}px;
            background-color: transparent;
          }
          h1, h2, h3 { color: #3DBE45; margin-top: 24px; margin-bottom: 12px; }
          h1 { font-size: 22px; font-weight: 700; }
          h2 { font-size: 18px; font-weight: 700; border-bottom: 1px solid #E5E9EB; padding-bottom: 8px; }
          h3 { font-size: 15px; font-weight: 700; }
          p { margin-bottom: 16px; text-align: justify; }
          ol, ul { margin: 0 0 16px 20px; padding: 0; }
          li { margin-bottom: 6px; }
          .katex-display { margin: 1.5em 0; overflow-x: auto; overflow-y: hidden; }
          .callout {
            background-color: #EAF7EB;
            border-left: 4px solid #3DBE45;
            padding: 12px 16px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .callout-title {
            font-weight: 700;
            font-size: 12px;
            color: #2A9B33;
            letter-spacing: 1px;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
        </style>
      </head>
      <body>
        ${content}
        <script>
          function postHeight() {
            var h = document.body.scrollHeight;
            if (window.ReactNativeWebView && h) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', value: h }));
            }
          }
          document.addEventListener("DOMContentLoaded", function() {
            if (typeof renderMathInElement === 'function') {
              renderMathInElement(document.body, {
                delimiters: [
                  {left: '$$', right: '$$', display: true},
                  {left: '$', right: '$', display: false},
                  {left: '\\\\(', right: '\\\\)', display: false},
                  {left: '\\\\[', right: '\\\\]', display: true}
                ],
                throwOnError : false
              });
            }
            // Premier post immediat, puis observer les changements (KaTeX,
            // images chargees, fonts qui arrivent en differe).
            postHeight();
            if (typeof ResizeObserver !== 'undefined') {
              new ResizeObserver(postHeight).observe(document.body);
            } else {
              window.addEventListener('load', postHeight);
              setTimeout(postHeight, 800);
            }
          });
        </script>
      </body>
    </html>
  `;

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'height' && typeof msg.value === 'number' && msg.value > 0) {
        setHeight(msg.value);
      }
    } catch {
      // payload non JSON — on ignore
    }
  };

  return (
    <View style={[styles.container, { height: height ?? 1 }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlTemplate }}
        style={styles.webview}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        startInLoadingState={true}
        onMessage={handleMessage}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#3DBE45" />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

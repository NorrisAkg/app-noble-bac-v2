import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface TexRendererProps {
  content: string; // HTML with LaTeX content (delimited by $ or $$)
  padding?: number;
}

export const TexRenderer: React.FC<TexRendererProps> = ({ content, padding = 20 }) => {
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
          body {
            font-family: 'Poppins', sans-serif;
            font-size: 15px;
            color: #1A2027;
            line-height: 1.6;
            margin: 0;
            padding: ${padding}px;
            background-color: transparent;
          }
          h1, h2, h3 { color: #3DBE45; margin-top: 24px; margin-bottom: 12px; }
          h1 { font-size: 22px; font-weight: 700; }
          h2 { font-size: 18px; font-weight: 700; border-bottom: 1px solid #E5E9EB; padding-bottom: 8px; }
          p { margin-bottom: 16px; text-align: justify; }
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
          document.addEventListener("DOMContentLoaded", function() {
            renderMathInElement(document.body, {
              delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\\\(', right: '\\\\)', display: false},
                {left: '\\\\[', right: '\\\\]', display: true}
              ],
              throwOnError : false
            });
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlTemplate }}
        style={styles.webview}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        startInLoadingState={true}
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
    flex: 1,
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

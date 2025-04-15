# SRT Subtitle Translator with Gemini AI

This is a web application that translates subtitle files (SRT format) using Google's Gemini AI. The application provides a simple interface to upload subtitle files, translate them to various languages, and export the translated subtitles.

## Features

- Upload and parse SRT subtitle files
- Translate subtitles to various languages using Gemini AI
- Customize prompts for translation
- Real-time translation progress tracking
- Context-aware translation to maintain consistency
- Batch processing to optimize API usage
- Automatic rate limiting with exponential backoff
- Manual editing of translated subtitles
- Retry functionality for failed translations
- Export translated subtitles as SRT files

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- A Google Gemini API key (https://ai.google.dev/)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/subtitle-translate-v2.git
   cd subtitle-translate-v2
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your Gemini API key:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Open your browser and navigate to http://localhost:3000

### Usage

1. Click the file input to select an SRT subtitle file
2. Choose your target language from the dropdown
3. Customize the translation prompt if needed
4. Click "Start Translation" to begin the translation process
5. Monitor progress in real-time
6. Edit any translations as needed by clicking the "Edit" button
7. Retry failed translations by clicking "Retry"
8. Once translation is complete, click "Export Translated SRT" to download the translated subtitle file

## Technical Details

- Built with Next.js 15.3.0
- Uses Google's Gemini AI for high-quality translations
- Implements batch processing to optimize API usage
- Includes rate limiting with automatic retries
- Context-aware translations for better coherence
- Responsive UI built with Tailwind CSS

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Google Generative AI for providing the translation capabilities
- Next.js team for the excellent framework
- [ShadCN UI](https://ui.shadcn.com/) for the UI components

# Kurdish Dubbing Application - Design Guidelines

## Design Approach

**Selected Approach:** Design System with Creative Media Inspiration

**Justification:** This is a utility-focused transcription/translation tool requiring clarity and efficiency, but with creative media elements. We'll use Material Design principles as the foundation, drawing inspiration from modern media tools like Descript and Riverside.fm for the upload/playback interfaces.

**Key Design Principles:**
- Clarity and efficiency in workflow presentation
- Professional yet approachable aesthetic
- Clear visual feedback for multi-step processes
- Kurdish cultural respect through thoughtful color choices

---

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary):**
- Background: 220 15% 12%
- Surface: 220 15% 16%
- Surface Elevated: 220 15% 20%
- Primary: 142 70% 45% (Kurdish green - represents Kurdish flag and culture)
- Primary Hover: 142 70% 40%
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 70%
- Border: 220 15% 25%
- Success: 142 70% 45%
- Error: 0 70% 55%

**Light Mode:**
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Surface Elevated: 220 15% 97%
- Primary: 142 60% 40%
- Primary Hover: 142 60% 35%
- Text Primary: 220 15% 15%
- Text Secondary: 220 10% 40%
- Border: 220 15% 85%

### B. Typography

**Font Families:**
- Primary: Inter (via Google Fonts CDN) - modern, highly legible
- Monospace: JetBrains Mono (for SRT/code display)

**Type Scale:**
- Hero Headline: text-5xl md:text-6xl font-bold (48-60px)
- Section Heading: text-3xl md:text-4xl font-semibold (30-36px)
- Card Title: text-xl font-semibold (20px)
- Body Large: text-lg (18px)
- Body: text-base (16px)
- Small: text-sm (14px)
- Caption: text-xs (12px)

### C. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16, 24 exclusively
- Micro spacing: p-2, gap-2
- Standard: p-4, gap-4, m-4
- Section padding: p-8, py-12, py-16
- Large gaps: gap-8, gap-12

**Container Strategy:**
- Max width: max-w-6xl for main content
- Upload area: max-w-4xl
- Results grid: max-w-7xl for multi-column layouts

### D. Component Library

**Navigation:**
- Simple top bar with logo left, minimal navigation right
- Height: h-16
- Background: Surface color with subtle border-b

**Upload Interface:**
- Large drag-drop zone: min-h-64 with dashed border (border-2 border-dashed)
- Hover state: background shift to surface-elevated, border to primary
- File icon centered above text
- Support text: "Drag video/audio file or click to browse"
- Accepted formats displayed below in text-sm text-secondary

**Processing Status:**
- Multi-step progress indicator with 4 stages:
  1. Extracting Audio
  2. Transcribing
  3. Translating to Kurdish
  4. Generating Dubbing
- Each step: circular progress spinner or checkmark when complete
- Current step highlighted in primary color
- Progress bar beneath steps showing overall completion

**Results Display (3-column grid on desktop, stacked on mobile):**

Column 1 - Original Transcription:
- Card with rounded-lg border
- Header: "Original Transcription" with language badge
- Scrollable text area: max-h-96 with custom scrollbar
- Copy button top-right

Column 2 - Kurdish Translation:
- Matching card design
- Header: "Kurdish Translation (ckb)" 
- Kurdish text displayed in larger font (text-lg)
- Right-to-left text support if needed
- Copy button top-right

Column 3 - Subtitles (SRT):
- Card with monospace font display
- Header: "Generated Subtitles"
- Scrollable pre-formatted text
- Download SRT button

**Audio Player:**
- Full-width card below results grid
- Custom-styled audio player with:
  - Play/pause button (large, circular, primary color)
  - Waveform visualization (decorative bars)
  - Time display (current / total)
  - Volume control
  - Download dubbed audio button (prominent, primary colored)

**Buttons:**
- Primary: bg-primary with rounded-lg, px-6 py-3
- Secondary: border border-primary text-primary with rounded-lg
- Icon buttons: rounded-full p-2 with hover bg-surface-elevated

### E. Animations

**Minimal, purposeful only:**
- Upload zone hover: transition-colors duration-200
- Processing steps: fade-in as they activate
- Success states: subtle scale animation (scale-105) on completion
- No continuous or distracting animations

---

## Page Structure

**Single-Page Application Layout:**

1. **Header** (h-16, full-width)
   - Logo and app name left
   - Language selector right (optional)

2. **Hero Section** (py-16 md:py-24, centered)
   - Headline: "Professional Kurdish Dubbing & Translation"
   - Subheading: "Upload your video or audio, get Kurdish dubbing with synchronized subtitles"
   - Trust indicator: "Powered by OpenAI Whisper & ElevenLabs"

3. **Upload Section** (py-12, max-w-4xl mx-auto)
   - Large drag-drop zone
   - Format specifications below
   - Quick tips about file size/duration

4. **Processing Section** (conditional, py-12)
   - 4-step progress indicator
   - Status messages for each step
   - Estimated time remaining

5. **Results Section** (conditional, py-12, max-w-7xl mx-auto)
   - 3-column grid (grid-cols-1 md:grid-cols-3 gap-6)
   - Audio player full-width below grid
   - Action buttons (Download All, Start New)

6. **Footer** (py-8, border-t)
   - Minimal: Copyright, API credits, links

---

## Images

**No hero image needed** - this is a utility application where the upload interface serves as the primary visual focus. The drag-drop zone itself becomes the hero element with clear iconography (upload cloud icon from Heroicons).

**Icons:**
Use Heroicons (CDN) throughout:
- CloudArrowUpIcon for upload
- CheckCircleIcon for completed steps
- ClockIcon for processing
- DocumentTextIcon for transcription
- LanguageIcon for translation
- SpeakerWaveIcon for audio/dubbing
- ArrowDownTrayIcon for downloads

---

## Responsive Behavior

**Mobile (< 768px):**
- Single column layout throughout
- Upload zone: min-h-48 instead of 64
- Progress steps: vertical instead of horizontal
- Results cards: stacked with gap-4
- Audio player: simplified controls

**Desktop (≥ 768px):**
- Full multi-column layouts
- Horizontal progress indicator
- Side-by-side results comparison
- Enhanced audio player with waveform
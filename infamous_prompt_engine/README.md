# Infæmous Freight Infinite Prompt Engine

This folder contains a modular prompt generation system that keeps visual outputs aligned to a consistent Infæmous Freight brand identity.

## Structure

- `modules/`: interchangeable prompt blocks (`environment`, `subject`, `action`, `style`, `lighting`)
- `generator/`: image and video prompt templates
- `scripts/generate-prompts.js`: batch generator
- `output/weekly_prompts.txt`: generated prompt set for production use

## Usage

Generate the default weekly batch (30 prompts per mode):

```bash
node infamous_prompt_engine/scripts/generate-prompts.js
```

Generate a custom batch size:

```bash
node infamous_prompt_engine/scripts/generate-prompts.js 50
```

## Workflow

1. Run the generator script.
2. Feed image/video prompts into your creative model pipeline.
3. Export generated assets.
4. Store approved files in your media library.

Projected annual asset output = `weekly_prompt_count × 52`.

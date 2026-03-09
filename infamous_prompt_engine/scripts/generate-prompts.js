#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const engineRoot = path.resolve(__dirname, '..');
const modulesDir = path.join(engineRoot, 'modules');
const generatorDir = path.join(engineRoot, 'generator');
const outputDir = path.join(engineRoot, 'output');

const outputCountArg = process.argv[2];
const outputCount = Number.isInteger(Number(outputCountArg)) ? Number(outputCountArg) : 30;

function readLines(filePath) {
  return fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function pickRandom(values) {
  return values[Math.floor(Math.random() * values.length)];
}

const environments = readLines(path.join(modulesDir, 'environments.txt'));
const subjects = readLines(path.join(modulesDir, 'subjects.txt'));
const actions = readLines(path.join(modulesDir, 'actions.txt'));
const styles = readLines(path.join(modulesDir, 'styles.txt'));
const lighting = readLines(path.join(modulesDir, 'lighting.txt'));

const promptTemplate = fs.readFileSync(path.join(generatorDir, 'prompt_template.txt'), 'utf8').trim();
const videoPromptTemplate = fs.readFileSync(path.join(generatorDir, 'video_prompt_template.txt'), 'utf8').trim();

const generatedPrompts = [];
const generatedVideoPrompts = [];

for (let i = 0; i < outputCount; i += 1) {
  const replacement = {
    environment: pickRandom(environments),
    subject: pickRandom(subjects),
    action: pickRandom(actions),
    style: pickRandom(styles),
    lighting: pickRandom(lighting),
  };

  generatedPrompts.push(
    promptTemplate.replace(/{(\w+)}/g, (match, key) => replacement[key] || match)
  );

  generatedVideoPrompts.push(
    videoPromptTemplate.replace(/{(\w+)}/g, (match, key) => replacement[key] || match)
  );
}

const weeklyOutput = [
  '# Weekly Prompt Batch',
  `Generated: ${new Date().toISOString()}`,
  `Count: ${outputCount}`,
  '',
  '## Image Prompts',
  ...generatedPrompts.map((prompt, index) => `${index + 1}. ${prompt}`),
  '',
  '## Video Prompts',
  ...generatedVideoPrompts.map((prompt, index) => `${index + 1}. ${prompt}`),
  '',
  `Projected annual asset output (weekly ${outputCount}): ${outputCount * 52}`,
];

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'weekly_prompts.txt'), `${weeklyOutput.join('\n')}\n`);

console.log(`Generated ${outputCount} image + ${outputCount} video prompts.`);
console.log(`Saved to ${path.join('infamous_prompt_engine', 'output', 'weekly_prompts.txt')}`);

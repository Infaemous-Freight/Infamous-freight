import openai


class LLMClient:
    def __init__(self, settings):
        settings.require_openai()
        self.settings = settings
        self.client = openai.OpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
        )

    def parse(self, model_cls, instructions, user_input):
        response = self.client.responses.parse(
            model=self.settings.openai_model,
            instructions=instructions,
            input=user_input,
            text_format=model_cls,
        )
        parsed = response.output_parsed
        if parsed is None:
            raise RuntimeError('Model returned no structured output')
        return parsed

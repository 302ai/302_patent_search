# 💻🤖 Welcome to the AI Patent Search by 302.AI! 🚀✨

[中文](README_zh.md) | [English](README.md) | [日本語](README_ja.md)

An open-source version of the [AI Patent Search](https://302.ai/tools/patent/) from [302.AI](https://302.ai). You can log in directly to 302.AI to use the online version with zero code and zero configuration, or modify this project according to your own needs, input your API KEY from 302.AI, and deploy it yourself.

## ✨ About 302.AI ✨

[302.AI](https://302.ai) is an on-demand AI application platform that addresses the last mile issue of AI in practical use.
1. 🧠 It integrates the latest and most complete AI capabilities and brands, including but not limited to language models, image models, sound models, video models.
2. 🚀 Deep application development on foundational models, developing real AI products rather than simple chatbots.
3. 💰 Zero monthly fee, all features are pay-as-you-go, fully open to truly lower the threshold and increase the upper limit.
4. 🛠 A powerful management backend designed for teams and SMEs, allowing one-person management and multi-user access.
5. 🔗 All AI capabilities provide API access, and all tools are open source for customization (in progress).
6. 💡 A strong development team, releasing 2-3 new applications every week, with daily product updates. Developers interested in joining are welcome to contact us.

## Project Features
### Features

1. **🔍 Patent Search**:
   - Integrates patent resources from various patent offices, enabling users to quickly access patent information from different regions.
   - Provides advanced search features, allowing users to filter by date, language, patent type, and more.

2. **🔤 PDF Translation**:
   - Real-time translation of patent PDF content, supporting multiple languages.
   - Allows users to select the target language for multilingual access to document content.

3. **🤖 AI Full Text Analysis**:
   - Utilizes AI technology to automatically parse the full text of patents, extracting key content and information.
   - Provides summaries and analysis of patent content, helping users quickly understand the core of a patent.

4. **🧠 AI Q&A System**:
   - Offers intelligent Q&A functionality, allowing users to ask questions about specific patent texts.
   - AI generates answers in real-time based on patent content, improving the efficiency of information retrieval.

5. 🌐 Full Internationalization: Support for interface switching between Chinese, English, and Japanese.

With AI Patent Search, we can easily and quickly access patent information from different regions. 🎉💻 Let's explore the AI-driven world of coding together! 🌟🚀

## Tech Stack
- React
- Tailwind CSS
- Shadcn UI

## Development & Deployment
1. Clone the project `git clone https://github.com/302ai/302_patent_search`
2. Install dependencies `npm install`
3. Configure the 302 API KEY based on .env.example
4. Run the project `npm dev`
5. Build and deploy `docker build -t patent-search . && docker run -p 3000:80 patent-search`

## Interface Preview
![Interface Preview](docs/preview.jpg)
![Interface Preview](docs/preview2.jpg)
![Interface Preview](docs/preview3.jpg)
![Interface Preview](docs/preview4.jpg)
import {
  __commonJS
} from "./chunk-DI52DQAC.js";

// node_modules/markdown-it-html5-media/lib/index.js
var require_lib = __commonJS({
  "node_modules/markdown-it-html5-media/lib/index.js"(exports, module) {
    var validAudioExtensions = ["aac", "m4a", "mp3", "oga", "ogg", "wav"];
    var validVideoExtensions = ["mp4", "m4v", "ogv", "webm", "mpg", "mpeg"];
    var messages = {
      en: {
        "html5 video not supported": "Your browser does not support playing HTML5 video.",
        "html5 audio not supported": "Your browser does not support playing HTML5 audio.",
        "html5 media fallback link": 'You can <a href="%s" download>download the file</a> instead.',
        "html5 media description": "Here is a description of the content: %s"
      }
    };
    var translate = function(language, messageKey, messageParams) {
      if (!messages[language] || !messages[language][messageKey])
        language = "en";
      if (!messages[language])
        return "";
      let message = messages[language][messageKey] || "";
      if (messageParams)
        for (let param of messageParams)
          message = message.replace("%s", param);
      return message;
    };
    function tokenizeImagesAndMedia(state, silent, md) {
      let attrs, code, content, label, labelEnd, labelStart, pos, ref, res, title, token, tokens, start;
      let href = "", oldPos = state.pos, max = state.posMax;
      if (state.src.charCodeAt(state.pos) !== 33 || state.src.charCodeAt(state.pos + 1) !== 91)
        return false;
      labelStart = state.pos + 2;
      labelEnd = state.md.helpers.parseLinkLabel(state, state.pos + 1, false);
      if (labelEnd < 0)
        return false;
      pos = labelEnd + 1;
      if (pos < max && state.src.charCodeAt(pos) === 40) {
        pos++;
        for (; pos < max; pos++) {
          code = state.src.charCodeAt(pos);
          if (!md.utils.isSpace(code) && code !== 10)
            break;
        }
        if (pos >= max)
          return false;
        start = pos;
        res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
        if (res.ok) {
          href = state.md.normalizeLink(res.str);
          if (state.md.validateLink(href)) {
            pos = res.pos;
          } else {
            href = "";
          }
        }
        start = pos;
        for (; pos < max; pos++) {
          code = state.src.charCodeAt(pos);
          if (!md.utils.isSpace(code) && code !== 10)
            break;
        }
        res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
        if (pos < max && start !== pos && res.ok) {
          title = res.str;
          pos = res.pos;
          for (; pos < max; pos++) {
            code = state.src.charCodeAt(pos);
            if (!md.utils.isSpace(code) && code !== 10)
              break;
          }
        } else {
          title = "";
        }
        if (pos >= max || state.src.charCodeAt(pos) !== 41) {
          state.pos = oldPos;
          return false;
        }
        pos++;
      } else {
        if (typeof state.env.references === "undefined")
          return false;
        if (pos < max && state.src.charCodeAt(pos) === 91) {
          start = pos + 1;
          pos = state.md.helpers.parseLinkLabel(state, pos);
          if (pos >= 0) {
            label = state.src.slice(start, pos++);
          } else {
            pos = labelEnd + 1;
          }
        } else {
          pos = labelEnd + 1;
        }
        if (!label)
          label = state.src.slice(labelStart, labelEnd);
        ref = state.env.references[md.utils.normalizeReference(label)];
        if (!ref) {
          state.pos = oldPos;
          return false;
        }
        href = ref.href;
        title = ref.title;
      }
      state.pos = pos;
      state.posMax = max;
      if (silent)
        return true;
      content = state.src.slice(labelStart, labelEnd);
      state.md.inline.parse(
        content,
        state.md,
        state.env,
        tokens = []
      );
      const mediaType = guessMediaType(href);
      const tag = mediaType == "image" ? "img" : mediaType;
      token = state.push(mediaType, tag, 0);
      token.attrs = attrs = [
        ["src", href]
      ];
      if (mediaType == "image")
        attrs.push(["alt", ""]);
      token.children = tokens;
      token.content = content;
      if (title)
        attrs.push(["title", title]);
      state.pos = pos;
      state.posMax = max;
      return true;
    }
    function guessMediaType(url) {
      const extensionMatch = url.match(/\.([^/.]+)$/);
      if (extensionMatch === null)
        return "image";
      const extension = extensionMatch[1];
      if (validAudioExtensions.indexOf(extension.toLowerCase()) != -1)
        return "audio";
      else if (validVideoExtensions.indexOf(extension.toLowerCase()) != -1)
        return "video";
      else
        return "image";
    }
    function renderMedia(tokens, idx, options, env, md) {
      const token = tokens[idx];
      const type = token.type;
      if (type !== "video" && type !== "audio")
        return "";
      let attrs = options.html5Media[`${type}Attrs`].trim();
      if (attrs)
        attrs = " " + attrs;
      const url = token.attrs[token.attrIndex("src")][1];
      const title = token.attrIndex("title") != -1 ? ` title="${md.utils.escapeHtml(token.attrs[token.attrIndex("title")][1])}"` : "";
      const fallbackText = translate(env.language, `html5 ${type} not supported`) + "\n" + translate(env.language, "html5 media fallback link", [url]);
      const description = token.content ? "\n" + translate(env.language, "html5 media description", [md.utils.escapeHtml(token.content)]) : "";
      return `<${type} src="${url}"${title}${attrs}>
${fallbackText}${description}
</${type}>`;
    }
    function html5Media(md, options = {}) {
      if (options.messages)
        messages = options.messages;
      if (options.translateFn)
        translate = options.translateFn;
      const videoAttrs = options.videoAttrs !== void 0 ? options.videoAttrs : 'controls class="html5-video-player"';
      const audioAttrs = options.audioAttrs !== void 0 ? options.audioAttrs : 'controls class="html5-audio-player"';
      md.inline.ruler.at("image", (tokens, silent) => tokenizeImagesAndMedia(tokens, silent, md));
      md.renderer.rules.video = md.renderer.rules.audio = (tokens, idx, opt, env) => {
        opt.html5Media = {
          videoAttrs,
          audioAttrs
        };
        return renderMedia(tokens, idx, opt, env, md);
      };
    }
    module.exports = {
      html5Media,
      messages,
      // For partial customization of messages
      guessMediaType
    };
  }
});
export default require_lib();
//# sourceMappingURL=markdown-it-html5-media.js.map

import { useEffect, useState } from "react";

export const useRecaptcha = () => {
  const [isRecaptchaLoading, IsRecaptchaLoading] = useState(true);

  useEffect(() => {
    const loadScriptByURL = (id, url, callback) => {
      const isScriptExist = document.getElementById(id);

      if (!isScriptExist) {
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.src = url;
        script.id = id;
        script.onload = function () {
          if (callback) callback();
        };
        document.body.appendChild(script);
      }

      if (isScriptExist && callback) callback();
    };

    // load the script by passing the URL
    loadScriptByURL(
      "recaptcha-key",
      `https://www.google.com/recaptcha/api.js?render=${process.env.SITE_KEY}`,
      function () {
        console.log("Script loaded!");
        IsRecaptchaLoading(false);
      }
    );
  }, []);

  return { siteKey: process.env.SITE_KEY, isRecaptchaLoading };
};

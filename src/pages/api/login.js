import { annotateRecaptchaResponse, getIsBlocked } from "@/utils/cache";
import axios from "axios";

export default function handler(req, res) {
  const { token, ...form } = req.body;

  console.log(req.body)

  axios
    .post(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        secret: process.env.SECRET_KEY,
        response: token,
      },
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    )
    .then(({ data }) => {
      const { success, score, ...rest } = data

      if (!success || score < 0.3) {
        return res.status(400).json({ success, score, ...rest })
      }

      const strData = JSON.stringify(data)
      const isBlocked = getIsBlocked(strData)

      if (isBlocked) {
        return res.status(400).json({ error: 'Bloqueado!' })
      }

      annotateRecaptchaResponse(strData)

      return res.status(200).json(data);
    })
    .catch((error) => {
      res.status(400).json(error);
    });
}

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
const dns = require("dns");
const mongoose = require("mongoose");
const { type } = require("os");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser({ extended: false }));

app.use("/public", express.static(`${process.cwd()}/public`));

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Schema = mongoose.Schema;

let url_schema = new Schema({
  short_url: {
    type: Number,
    required: true,
  },
  original_url: {
    type: String,
    required: true,
  },
});

const Url = mongoose.model("Url", url_schema);

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.post("/api/shorturl", async function (req, res) {
  const { url } = req.body;

  const validUrl = new URL(url);

  if (validUrl.origin === null) {
    return res.json({ error: "invalid url" });
  }

  function short_url() {
    return Math.floor(Math.random() * 1000);
  }

  dns.lookup(validUrl.hostname, (err, address) => {
    if (err) {
      return res.json({ error: "invalid url" });
    }

    Url.create(
      {
        short_url: short_url(),
        original_url: url,
      },
      (err, data) => {
        if (err) {
          return err;
        }

        return res.json({ original_url: url, short_url: data?.short_url });
      }
    );
  });
});

app.get("/api/shorturl/:shorturl", async function (req, res) {
  const { shorturl } = req.params;

  if (typeof shorturl !== "string") {
    return res.json({ error: "url undefined" });
  }

  const short_url = Number(shorturl);
  Url.findOne(
    {
      short_url,
    },
    (err, data) => {
      if (err) return err;

      if (data === null)
        return res.json({ message: `no url for ${short_url}` });

      return res.redirect(data?.original_url);
    }
  );
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

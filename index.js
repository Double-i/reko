import express from "express";
import multer from "multer";
import ejs from "ejs";
import path from "path";
import { ListBucketsCommand } from "@aws-sdk/client-s3";
import { s3Client, rekoClient } from "./helper.js"; // Helper function that creates an Amazon S3 service client module.
import { RecognizeCelebritiesCommand } from "@aws-sdk/client-rekognition";
import { fileURLToPath } from "url";

const upload = multer({ dest: "uploads/" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const run = async () => {
    try {
        const data = await s3Client.send(new ListBucketsCommand({}));
        console.log("Success", data.Buckets);
        return data; // For unit tests.
    } catch (err) {
        console.log("Error", err);
    }
};

//run();

const bucket = "workshoprekobucket";
const barak = "Barack-Obama-Speech-3819398190.jpg";
const selfie = "selfie.jpg";

const photo = selfie;

// Set params
const params = {
    Image: {
        S3Object: {
            Bucket: bucket,
            Name: photo,
        },
    },
};

const recognize_celebrity = async () => {
    try {
        const response = await rekoClient.send(
            new RecognizeCelebritiesCommand(params)
        );
        console.log(response.Labels);
        response.CelebrityFaces.forEach((celebrity) => {
            console.log(`Name: ${celebrity.Name}`);
            console.log(`ID: ${celebrity.Id}`);
            console.log(`KnownGender: ${celebrity.KnownGender.Type}`);
            console.log(`Smile: ${celebrity.Smile}`);
            console.log("Position: ");
            console.log(`   Left: ${celebrity.Face.BoundingBox.Height}`);
            console.log(`  Top : ${celebrity.Face.BoundingBox.Top}`);
        });
        return response.length; // For unit tests.
    } catch (err) {
        console.log("Error", err);
    }
};

//recognize_celebrity();

const app = express();
const port = 3000;

app.engine(".html", ejs.__express);

// Optional since express defaults to CWD/views
app.set("views", path.join(__dirname, "views"));

// Path to our public directory

app.use(express.static(path.join(__dirname, "public")));

// Without this you would need to
// supply the extension to res.render()
// ex: res.render('users.html').
app.set("view engine", "html");

const pictures = [
    {
        src: "./test/test.jpg",
        celebrities: [{ name: "Brad" }, { name: "Angelina" }],
    },
    {
        src: "./test/test.jpg",
        celebrities: [{ name: "Brad" }, { name: "Angelina" }],
    },
    {
        src: "./test/test.jpg",
        celebrities: [{ name: "Brad" }, { name: "Angelina" }],
    },
    {
        src: "./test/test.jpg",
        celebrities: [{ name: "Brad" }, { name: "Angelina" }],
    },
    {
        src: "./test/test.jpg",
        celebrities: [{ name: "Brad" }, { name: "Angelina" }],
    },
    {
        src: "./test/test.jpg",
        celebrities: [{ name: "Brad" }, { name: "Angelina" }],
    },
    {
        src: "./test/test.jpg",
        celebrities: [{ name: "Brad" }, { name: "Angelina" }],
    },
    {
        src: "./test/test.jpg",
        celebrities: [{ name: "Brad" }, { name: "Angelina" }],
    },
];

app.get("/add", (req, res) => {
    res.render("add");
});
app.post("/add", upload.single('picture'),(req, res, next) => {
   console.log(req.picture)
   res.render("add",{status: "ok"})
});
app.get("/", (req, res) => {
    res.render("home", { pictures });
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
/**
 * TODO :
 *         - pouvoir ajouter une image sur express
 *         - pouvoir ajouter une image sur S3
 *         - pouvoir afficher une image stocké sur S3
 *         - effectuer le stockage de reko
 *         - effectuer la recherche
 *
 */

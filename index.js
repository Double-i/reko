import express from "express";
import multer from "multer";
import fs from "fs";
import ejs from "ejs";
import path from "path";
import { ListBucketsCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, rekoClient } from "./helper.js"; // Helper function that creates an Amazon S3 service client module.
import { RecognizeCelebritiesCommand } from "@aws-sdk/client-rekognition";
import { fileURLToPath } from "url";
import { Console } from "console";

const upload = multer({ dest: "uploads/" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUCKET_NAME = "workshoprekobucket";

const uploadFile = (path, name) => {
    const fileContent = fs.readFileSync(path);
    return s3Client.send(
        new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: name,
            Body: fileContent,
        })
    );
};

const run = async () => {
    try {
        const data = await s3Client.send(new ListBucketsCommand({}));
        console.log("Success", data.Buckets);
        return data; // For unit tests.
    } catch (err) {
        console.log("Error", err);
    }
};

const barak = "Barack-Obama-Speech-3819398190.jpg";
const selfie = "selfie.jpg";

const photo = selfie;

const recognize_celebrity = async () => {
    try {
        const response = await rekoClient.send(
            new RecognizeCelebritiesCommand({
                Image: {
                    S3Object: {
                        Bucket: BUCKET_NAME,
                        Name: photo,
                    },
                },
            })
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
app.post("/add", upload.single("picture"), async (req, res, next) => {
    console.log(req.file);
    try {
        console.log("try to upload to s3....");
        const resultat = await uploadFile(req.file.path, req.file.originalname);

        
        console.log("S3 response",resultat)
        res.render("add", { status: "0" });
    } catch (err) {
        console.error("Faild to upload to s3", err);
        res.render("add", { status: "1" });
    }
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

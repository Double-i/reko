import express from "express";
import multer from "multer";
import fs from "fs";
import ejs from "ejs";
import path from "path";
import {
    GetObjectCommand,
    ListBucketsCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { parseUrl } from "@aws-sdk/url-parser";
import { s3Client, rekoClient } from "./helper.js"; // Helper function that creates an Amazon S3 service client module.
import { RecognizeCelebritiesCommand } from "@aws-sdk/client-rekognition";
import { fileURLToPath } from "url";
import { Hash } from "@aws-sdk/hash-node";
import { HttpRequest } from "@aws-sdk/protocol-http";
const upload = multer({ dest: "uploads/" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BUCKET_NAME = "workshoprekobucket";
const REGION = "eu-central-1";
const pictures = [];

/**
 * Get data from json file
 * @returns
 */
const getFromJson = () => {
    return fs.readFile("db.json", (err, data) => {
        if (err) {
            console.error(err);
            return;
        }
        JSON.parse(data).map((pic) => pictures.push(pic));
    });
};
getFromJson();
/**
 * Save pictures into a json file
 * @param {*} object
 */
const saveToJson = (object) => {
    fs.writeFile("db.json", JSON.stringify(object), (error) => {
        if (error) throw error;
    });
};

/**
 * Upload file to s3
 * @param {*} path
 * @param {*} name
 * @returns
 */
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

/**
 * Call Aws reko to reko...
 * @param {*} photoName
 * @returns
 */
const recognize_celebrity = async (photoName) => {
    try {
        const response = await rekoClient.send(
            new RecognizeCelebritiesCommand({
                Image: {
                    S3Object: {
                        Bucket: BUCKET_NAME,
                        Name: photoName,
                    },
                },
            })
        );
        console.log(response.Labels);
        return response.CelebrityFaces;
    } catch (err) {
        console.log("Error", err);
    }
};

const app = express();
const port = 3000;

app.engine(".html", ejs.__express);
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "html");

app.get("/add", (req, res) => {
    res.render("add");
});

app.post("/add", upload.single("picture"), async (req, res, next) => {
    try {
        console.log("POST /add", pictures);

        const resultat = await uploadFile(req.file.path, req.file.originalname);
        const celebritiesDetection = await recognize_celebrity(
            req.file.originalname
        );

        pictures.push({
            celebrities: celebritiesDetection,
            src: req.file.originalname,
        });
        console.log("POST /add", pictures);
        saveToJson(pictures);
        res.render("add", { status: "0" });
    } catch (err) {
        console.error("POST /add", err);
        res.render("add", { status: "1" });
    }
});
/**
 * Presigned picture => to allow app user to access to s3 image for a certain time
 * @param {*} picture
 * @returns
 */
const signedPicture = async (picture) => {
    // Create a command to put the object in the S3 bucket.
    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: picture.src,
    });
    // Create the presigned URL.
    const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 3600,
    });
    return signedUrl;
};
app.get("/", async (req, res) => {
    let filteredPictures;
    const searchTerms = req.query.search;
    if (searchTerms && searchTerms !== "") {
        filteredPictures = pictures.filter((picture) => {
            let match = false;
            picture.celebrities.map((c) => {
                if (c.Name.toLowerCase().includes(searchTerms.toLowerCase())) {
                    match = true;
                }
            });
            return match;
        });
    } else {
        filteredPictures = pictures;
    }
    const tmpPictures = await Promise.all(
        filteredPictures.map(async (picture) => {
            return { ...picture, src: await signedPicture(picture) };
        })
    );
    res.render("home", { pictures: tmpPictures });
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
/**
 * TODO :
 *         - effectuer la recherche
 *
 */

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
import { s3Client, rekoClient } from "./helper.js"; // Helper function that creates an Amazon S3 service client module.
import { RecognizeCelebritiesCommand } from "@aws-sdk/client-rekognition";
import { fileURLToPath } from "url";
import { REGION, BUCKET_NAME } from "./s3info.js";
const upload = multer({ dest: "uploads/" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const pictures = []; // db ...

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

/**
 * Call Aws reko to reko...
 * @param {*} photoName
 * @returns
 */
const recognizeCelebrity = async (photoName) => {
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
        console.log("Recognize", response.Labels);
        return response.CelebrityFaces;
    } catch (err) {
        console.log("Error", err);
    }
};

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

const app = express();
const port = 3000;

app.engine(".html", ejs.__express);
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "html");

/**
 * GET add picture form endpoint
 */
app.get("/add", (req, res) => {
    res.render("add");
});

/**
 * POST add picture endpoint
 */
app.post("/add", upload.single("picture"), async (req, res, next) => {
    try {
        const resultat = await uploadFile(req.file.path, req.file.originalname);
        const celebritiesDetection = await recognizeCelebrity(
            req.file.originalname
        );

        pictures.push({
            celebrities: celebritiesDetection,
            src: req.file.originalname,
        });
        saveToJson(pictures);
        console.log("POST /add succeed");
        res.render("add", { status: "0" });
    } catch (err) {
        console.error("POST /add failed", err);
        res.render("add", { status: "1" });
    }
});

/**
 * Home endpoint.
 */
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

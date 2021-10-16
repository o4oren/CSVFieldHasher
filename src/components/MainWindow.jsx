import * as React from 'react';
import {Container, Row, Form, Button, Col, ProgressBar, Spinner} from "react-bootstrap";
import {useEffect, useState} from "react";

export const MainWindow = () => {
    const [srcFile, setSrcFile] = useState(null);
    const [dstFile, setDstFile] = useState(null);
    const [lineCount, setLineCount] = useState(0);
    const [processedLines, setProcessedLines] = useState(0);
    const [result, setResult] = useState(null);
    const [showProgress, setShowProgress] = useState(false);
    const [headers, setHeaders] = useState([]);
    const { ipcRenderer } = window.require("electron");

    useEffect(() => {
        console.log('mounting')
        ipcRenderer.on("select-file-reply", (event, arg) => {
            if(arg.error) {
                //TODO handle error
                console.log(arg.error)
            } else {
                setLineCount(arg.count);
                setHeaders(arg.headers);
            }
        })

        ipcRenderer.on('file-processing-done', (event, arg) => {
            if(arg.success) {
                setResult(arg);
            }
        });

        ipcRenderer.on('processed-lines', (event, arg) => {
            setProcessedLines(arg);
        })
    }, []);

    const selectSourceFile = () => {
        const files = document.getElementById("source-file-chooser").files;
        if(files && files.length > 0) {
            setSrcFile(files[0].path);
            setResult(null);
            ipcRenderer.send('select-file', files[0].path);
        }  else {
            setSrcFile(null);
            console.log('no files selected!')
        }
    }

    const processFile = () => {
        const columnHeader = document.getElementById("columns-header-select").value;
        ipcRenderer.send("process-file", {srcFile: srcFile, dstFile: dstFile, header: columnHeader});
        setShowProgress(true);
    }

    function getProgress() {
        if(showProgress) {
            console.log((processedLines / lineCount) * 100)
            return <div id="progress-bar">
                <ProgressBar now={(processedLines / lineCount) * 100} label={processedLines + ' of ' + (lineCount) + ' processed'} role="status" />
            </div>;
        }
        return null;
    }

    function getResultSection() {
        if(!result)
            return null;
        if(result.success) {
            return <div>
                {result.processedLines} records processed and saved to <br/>
                file is at {result.filePath}
            </div>;
        } else {
            return <div>
                Error!
            </div>
        }
    }

    function getColumnSelector() {
        console.log(headers.length)
        if(headers.length == 0) {
            return null;
        }

        return <Form.Group controlId="columns-header-select" className="mb-3">
            <p>{lineCount} records in file</p>
            <Form.Label>Select column to hash</Form.Label>
            <Form.Select aria-label="Select column to hash">
                {headers.map(header => <option value={header} key={header}>{header}</option>)}
            </Form.Select>
        </Form.Group>
    }

    return <Container>
        <Row>
            <h2>CSV Line Hasher</h2>
        </Row>
        <Row>
            <p>This application takes a CSV file and hashes the contents in the provided column</p>
        </Row>
        <Row>
            <Form>
                <Form.Group controlId="source-file-chooser" className="mb-3">
                    <Form.Label>Source file</Form.Label>
                    <Form.Control type="file" onChange={selectSourceFile}/>
                </Form.Group>
                {getColumnSelector()}
            </Form>
        </Row>
        <Row>
            <Col sm>
                <Button
                    variant="primary"
                    onClick={processFile}
                    disabled={headers.length == 0}
                >
                    Hash!
                </Button>
            </Col>
        </Row>
        <Row>
            {getProgress()}
        </Row>
        <Row>
            {getResultSection()}
        </Row>
    </Container>;
};

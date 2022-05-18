#!/usr/bin/evn node
import axios from 'axios'
import inquirer from 'inquirer'
import fetch from 'node-fetch'
import fs from 'fs-extra'
import admZip from 'adm-zip'
import { createSpinner } from 'nanospinner'

const inputPrams = async () => {
    const input = await inquirer.prompt([
        {
            name: 'repoInput',
            type: 'input',
            message: 'Enter repository search name: ',
            default() {
                return 'tetris'
            }
        },
        {
            name: 'langInput',
            type: 'input',
            message: 'Enter the language that the projects are written in: ',
            default() {
                return 'java'
            }
        },
        {
            name: 'numInput',
            type: 'input',
            message: 'Enter the number of repositories to download: ',
            default() {
                return '10'
            }
        }
    ])

    return {
        repo: input.repoInput,
        lang: input.langInput,
        num: input.numInput
    }
}


const getRepos = async (searchParam) => {
    try {
        var req = await axios(`https://api.github.com/search/repositories?q=${searchParam.repo}+language:${searchParam.lang}&per_page=${searchParam.num}`)
    } catch (error) {
        console.log(err)
        return
    }
    return req.data.items
}

const handleDownloads = async (repo, dir_downloadFolder, index) => {


    const downloadMessage = repo.name + ' | Downloading...'
    const successMessage = repo.name + ' | Success!'
    const errorMessage = repo.name + ' | Failed!'
    const donwloadSpinner = createSpinner(downloadMessage)
    donwloadSpinner.start()

    const writer = fs.createWriteStream(`${dir_downloadFolder}master${index}.zip`);

    (await fetch(repo.html_url)).body.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', () => {
            donwloadSpinner.success({ text: successMessage })

            var zip = new admZip(`${dir_downloadFolder}master${index}.zip`)
            zip.extractAllTo(dir_downloadFolder)
            try {
                fs.unlinkSync(`${dir_downloadFolder}master${index}.zip`)
            } catch (err) {
                console.error(err)
            }

            resolve
        });
        writer.on('error', () => {
            donwloadSpinner.err({ text: errorMessage })
            reject
        })
    });

}

const main = async () => {
    if (!fs.existsSync('./repositories')) {
        fs.mkdirSync('./repositories')
    }

    let searchParam = await inputPrams()

    const repositories = await getRepos(searchParam)

    const date = new Date(Date.now())

    const folderDate =
        (`0${date.getDate()}`).slice(-2) + '.'
        + (`0${date.getMonth()}`).slice(-2) + '.'
        + date.getFullYear() + ' ('
        + (`0${date.getHours()}`).slice(-2) + 'H-'
        + (`0${date.getMinutes()}`).slice(-2) + 'm-'
        + (`0${date.getSeconds()}`).slice(-2) + 's)'

    const dir_downloadFolder = `./repositories/${folderDate}/`

    fs.mkdirSync(dir_downloadFolder)

    const downloads = repositories.map(repo => {
        return {
            name: repo.name,
            html_url: `${repo.html_url}/archive/master.zip`
        }
    })

    const promises = downloads.map(async (element, index) => await handleDownloads(element, dir_downloadFolder, index))

    Promise.all(promises)
}


await main()



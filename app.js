#!/usr/bin/evn node
import axios from 'axios'
import inquirer from 'inquirer'
import fs from 'fs'
import request from 'superagent'
import admZip from 'adm-zip'
import { createSpinner } from 'nanospinner'

if (!fs.existsSync('./repositories')) {
    fs.mkdirSync('./repositories')
}

var repositories = {}

var searchParam = {
    repo: null,
    lang: null,
    num: null
}

var downloads = []

console.log('\n\n\n')

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

    searchParam.repo = input.repoInput
    searchParam.lang = input.langInput
    searchParam.num = input.numInput
}


const getRepos = async () => {
    try {
        var req = await axios(`https://api.github.com/search/repositories?q=${searchParam.repo}+language:${searchParam.lang}&per_page=${searchParam.num}`)
    } catch (error) {
        console.log(err)
        return
    }
    return req.data.items
}

await inputPrams()
repositories = await getRepos()

for (var i = 0; i < Array.from(repositories).length; ++i) {
    var obj = {
        name: repositories[i].name,
        description: repositories[i].description,
        html_url: repositories[i].html_url + '/archive/master.zip'
    }

    downloads.push(obj)
}

const downloadRepos = async () => {
    const date = new Date(Date.now())
    var folderDate =
        (`0${date.getDate()}`).slice(-2) + '.'
        + (`0${date.getMonth()}`).slice(-2) + '.'
        + date.getFullYear() + ' ('
        + (`0${date.getHours()}`).slice(-2) + 'H-'
        + (`0${date.getMinutes()}`).slice(-2) + 'm-'
        + (`0${date.getSeconds()}`).slice(-2) + 's)'

    var dir_downloadFolder = './repositories/' + folderDate
    fs.mkdirSync(dir_downloadFolder)

    const handleDownloads = async (repo) => {

        const downloadMessage = repo.name + ' | Downloading...'
        const successMessage = repo.name + ' | Success!'
        const errorMessage = repo.name + ' | Failed!'
        const donwloadSpinner = createSpinner(downloadMessage)
        donwloadSpinner.start()

        request
            .get(repo.html_url)
            .on('error', (error) => {
                donwloadSpinner.error({ text: errorMessage, mark: '❌' })
            })
            .pipe(fs.createWriteStream(dir_downloadFolder + '/master.zip'))
            .on('finish', () => {
                donwloadSpinner.success({ text: successMessage })

                var zip = new admZip(dir_downloadFolder + '/master.zip');
                zip.extractAllTo(dir_downloadFolder)
                try {
                    fs.unlinkSync(dir_downloadFolder + '/master.zip')
                } catch (err) {
                    console.error(err)
                }
            })
    }

    for await(const element of downloads){
        handleDownloads(element)
    }
    
}
await downloadRepos()
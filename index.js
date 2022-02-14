const config = require('./config')
const compressFile = require('./module/compressFile')
const { connectServe, ssh } = require('./module/ssh')
const uploadFile = require('./module/uploadFile')
const runCommand = require('./module/handleCommand')
const fs = require('fs')
const path = require('path')

async function main() {
    try {
        const localFile = __dirname + '/' + config.targetFile // 待上传本地文件
        config.openCompress ? await compressFile(config.targetDir, localFile) : '' //压缩
        await connectServe(config.ssh)// 连接
        await uploadFile(ssh, config, localFile)// 上传
        // 服务器如果没有安装unzip命令，需安装解压命令 yum install -y unzip zip   不然会报错
        await runCommand(ssh, 'unzip ' + config.targetFile, config.deployDir) // 解压
        await runCommand(ssh, 'mv dist ' + config.releaseDir, config.deployDir)// 修改文件名称,这个dist要与压缩文件创建的文件夹名字一致!!
        await runCommand(ssh, 'rm -f ' + config.targetFile, config.deployDir) // 删除
        try {
            fs.accessSync(`${__dirname}/dist.zip`)
            fs.unlink(`${__dirname}/dist.zip`, err => {
                if (err) throw err
                console.log("6.删除本地dist文件成功")
                // 删除打包项目中的dist文件夹
                // removeLocalDir()
                process.exit()
            })
        } catch (error) {
            console.log("没有dist文件可操作")
        }
    } catch (error) {
        console.log("部署过程出现异常！", error)
    }
}
// 删出项目中打包出来的dist文件夹
async function removeLocalDir() {
    try {
        // path.resolve(__dirname,'..') 父级目录
        fs.accessSync(`${path.resolve(__dirname, '..')}/dist`) //检测文件夹是否存在
        // {recursive: true} 添加删除文件夹的权限,删除非空文件夹
        // rmdir异步删除
        fs.rmdir(`${path.resolve(__dirname, '..')}/dist`, { recursive: true }, err => {
            if (err) throw err
            console.log("7.删除项目打包的dist文件夹成功")
            process.exit()
        })
    } catch (error) {
        console.log("当前没检测到dist文件夹")
        process.exit()
    }
}

main()
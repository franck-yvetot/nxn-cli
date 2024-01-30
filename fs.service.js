const fs = require('fs');

class FSSce
{
    copyDir(src, dest) 
    {
        fs.mkdirSync(dest, { recursive: true });

        const files = fs.readdirSync(src);
        
        files.forEach(file => 
        {
          const current = fs.lstatSync(`${src}/${file}`);
        
          if (current.isDirectory()) 
          {
            copyDir(`${src}/${file}`, `${dest}/${file}`);
          } 
          else if (current.isSymbolicLink()) 
          {
            const symlink = fs.readlinkSync(`${src}/${file}`);
            fs.symlinkSync(symlink, `${dest}/${file}`);
          } 
          else 
          {
            fs.copyFileSync(`${src}/${file}`, `${dest}/${file}`);
          }
        });
    }
}

module.exports = new FSSce();


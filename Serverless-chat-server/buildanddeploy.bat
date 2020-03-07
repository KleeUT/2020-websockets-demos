call npm run build
copy .\package.json .\build\
copy .\package-lock.json .\build\
cd .\build\
call npm ci
cd ..

echo ----------compile done-------------
call sam build
echo ----------build done ------------
call sam package --output-template-file packaged.yaml --s3-bucket kleeut-lambda
echo -----------package done ---------------
call sam deploy --template-file .\packaged.yaml --region ap-southeast-2 --capabilities CAPABILITY_IAM --stack-name socket-chat-example

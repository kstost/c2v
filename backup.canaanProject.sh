rm -rf __canaanProject;
mkdir __canaanProject;

# cd canaanProject
# source prepare_dist_shorts_maker.sh
# cd ..

cp -R canaanProject __canaanProject;

rm -rf __canaanProject/canaanProject/c2v/node_modules;

cd __canaanProject;
tar cfpz _canaanProject.tgz canaanProject;
mv _canaanProject.tgz ../;
cd ..;
rm -rf __canaanProject;



// NUMBER×RUSH Vol.38: exhaustive 1..2 NORMAL/DOUBLE G2 and G4 closure witness.
// Compile: g++ -O3 -std=c++17 -Wall -Wextra tools/verify-vol38.cpp -o /tmp/verify38
// Run: /tmp/verify38
#include <bits/stdc++.h>
using namespace std;
int main(){
 const int N=4096;
 static uint8_t val[N][6],eff[N][6],sum[N][64],sz[64];
 static uint16_t possible[N][5];
 for(int x=0;x<N;x++){int z=x;for(int i=0;i<6;i++){int t=z%4;z/=4;val[x][i]=1+(t&1);eff[x][i]=val[x][i]*(1+(t>>1));}}
 for(int m=1;m<64;m++)sz[m]=__builtin_popcount((unsigned)m);
 for(int b=0;b<N;b++)for(int m=1;m<64;m++){
  int s=0,o=0,e=0;
  for(int i=0;i<6;i++)if(m>>i&1){s+=eff[b][i];o|=val[b][i]%2;e|=val[b][i]%2==0;}
  sum[b][m]=s;uint16_t bit=1u<<s;
  possible[b][0]|=bit;
  if(sz[m]==2)possible[b][1]|=bit;
  if(sz[m]==3)possible[b][2]|=bit;
  if(o)possible[b][3]|=bit;
  if(e)possible[b][4]|=bit;
 }
 long long states=0,routes=0,valid[5]{},zero[5]{},total[5]{};
 int low[5]={99,99,99,99,99},high[5]{};
 for(int b=0;b<N;b++)for(int q=0;q<N;q++){
  uint16_t common[25][5];bool seen[25]{};
  for(int t=0;t<25;t++)for(int j=0;j<5;j++)common[t][j]=0xfffe;
  for(int m=1;m<64;m++){
   int t=sum[b][m],after=0,p=1,k=0;
   for(int i=0;i<6;i++){
    int v=(m>>i&1)?((q>>(2*k++))&3):((b>>(2*i))&3);
    after+=v*p;p*=4;
   }
   seen[t]=true;routes++;
   for(int j=0;j<5;j++)common[t][j]&=possible[after][j];
  }
  for(int t=1;t<25;t++)if(seen[t]){
   states++;
   for(int j=0;j<5;j++){
    valid[j]+=!!(possible[b][j]&(1u<<t));
    int c=__builtin_popcount((unsigned)common[t][j]);
    zero[j]+=c==0;total[j]+=c;
    low[j]=min(low[j],c);high[j]=max(high[j],c);
   }
  }
 }
 cout<<"pairs "<<1LL*N*N<<" states "<<states<<" routes "<<routes<<"\n";
 const char* name[]={"FREE","PAIR","TRIPLE","ODD","EVEN"};
 for(int j=0;j<5;j++)cout<<name[j]<<" valid "<<valid[j]<<" zero "<<zero[j]
   <<" total "<<total[j]<<" min "<<low[j]<<" max "<<high[j]<<"\n";
 const long long ev[]={195125248,68714496,76496896,187203584,174182400};
 const long long ez[]={0,11520,1218912,8206720,7218176};
 const long long et[]={2206872136LL,722221844LL,750783188LL,2018166124LL,1890978868LL};
 const int emin[]={3,0,0,0,0},emax[]={15,6,7,15,14};
 bool ok=states==202088448LL&&routes==1056964608LL;
 for(int j=0;j<5;j++)ok&=valid[j]==ev[j]&&zero[j]==ez[j]&&total[j]==et[j]&&low[j]==emin[j]&&high[j]==emax[j];
 if(!ok){cerr<<"FAIL Vol.38 regression\n";return 1;}
 cout<<"PASS Vol.38 exhaustive verification\n";
}

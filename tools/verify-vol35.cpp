// NUMBER×RUSH Vol.35: exhaustive safety check for digits 1..4.
// Compile: g++ -O3 -std=c++17 -Wall -Wextra tools/verify-vol35.cpp -o /tmp/verify35
// Run: /tmp/verify35
// All 4^6 boards x 4^6 reserved queues, 63 TARGET-matching masks,
// five missions. Includes TARGET CLEAR even when current mission is unmet.
#include <bits/stdc++.h>
using namespace std;
int main(){
 constexpr int N=4096;
 static uint8_t digits[N][6],sums[N][64],sizes[64];
 static uint32_t possible[N][5];
 for(int b=0;b<N;b++){int z=b;for(int i=0;i<6;i++){digits[b][i]=z%4+1;z/=4;}}
 for(int mask=1;mask<64;mask++)sizes[mask]=__builtin_popcount((unsigned)mask);
 for(int b=0;b<N;b++)for(int mask=1;mask<64;mask++){
  int sum=0,odd=0,even=0;
  for(int i=0;i<6;i++)if(mask>>i&1){
   sum+=digits[b][i];odd|=digits[b][i]%2;even|=(digits[b][i]%2==0);
  }
  sums[b][mask]=sum;uint32_t bit=1u<<sum;
  possible[b][0]|=bit;
  if(sizes[mask]==2)possible[b][1]|=bit;
  if(sizes[mask]==3)possible[b][2]|=bit;
  if(odd)possible[b][3]|=bit;
  if(even)possible[b][4]|=bit;
 }
 long long states=0,routes=0,valid[5]{},zero[5]{};
 int minCandidates[5]={99,99,99,99,99},maxCandidates[5]{};
 for(int b=0;b<N;b++)for(int q=0;q<N;q++){
  uint32_t common[25][5];bool seen[25]{};
  for(int t=0;t<25;t++)for(int j=0;j<5;j++)common[t][j]=(1u<<25)-2;
  for(int mask=1;mask<64;mask++){
   int t=sums[b][mask],after=0,p=1,k=0;
   for(int i=0;i<6;i++){int v=(mask>>i&1)?digits[q][k++]:digits[b][i];after+=(v-1)*p;p*=4;}
   seen[t]=true;routes++;
   for(int j=0;j<5;j++)common[t][j]&=possible[after][j];
  }
  for(int t=1;t<=24;t++)if(seen[t]){
   states++;
   for(int j=0;j<5;j++){
    valid[j]+=!!(possible[b][j]&(1u<<t));
    int c=__builtin_popcount(common[t][j]);
    zero[j]+=c==0;minCandidates[j]=min(minCandidates[j],c);
    maxCandidates[j]=max(maxCandidates[j],c);
   }
  }
 }
 const char* names[]={"FREE","PAIR","TRIPLE","ODD","EVEN"};
 cout<<"board_queue="<<1LL*N*N<<" states="<<states<<" routes="<<routes<<"\n";
 for(int j=0;j<5;j++)cout<<names[j]<<" current="<<valid[j]<<" next_zero="<<zero[j]
   <<" min="<<minCandidates[j]<<" max="<<maxCandidates[j]<<"\n";
 const long long expectValid[]={239894528,82935808,92520448,217071616,214441984};
 const long long expectZero[]={0,22560,765780,7218176,7851160};
 const int expectMin[]={3,0,0,0,0},expectMax[]={19,7,8,17,18};
 bool ok=states==239894528LL&&routes==1056964608LL;
 for(int j=0;j<5;j++)ok&=valid[j]==expectValid[j]&&zero[j]==expectZero[j]
   &&minCandidates[j]==expectMin[j]&&maxCandidates[j]==expectMax[j];
 if(!ok){cerr<<"FAIL: Vol.35 exhaustive regression\n";return 1;}
 cout<<"PASS: Vol.35 all five missions digits 1..4\n";
}

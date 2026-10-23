// NUMBER×RUSH Vol.32 — independent exhaustive verification.
// Compile: g++ -O3 -std=c++17 tools/verify-vol32.cpp -o /tmp/verify-vol32
// Run: /tmp/verify-vol32
// Scope: six ordinary tiles in {1,2,3}, six immutable reserved queue tiles,
// all TARGET-matching subsets, NEXT FREE/PAIR. No specials or REFRESH.
#include <bits/stdc++.h>
using namespace std;
int main(){
 constexpr int N=729; int d[N][6], sum[N][64],count[64]; uint32_t poss[N][2]{};
 for(int x=0;x<N;x++){int z=x;for(int i=0;i<6;i++){d[x][i]=z%3+1;z/=3;}}
 for(int m=1;m<64;m++)count[m]=__builtin_popcount((unsigned)m);
 for(int b=0;b<N;b++)for(int m=1;m<64;m++){
   int s=0;for(int i=0;i<6;i++)if(m>>i&1)s+=d[b][i];
   sum[b][m]=s;poss[b][0]|=1u<<s;
   if(count[m]==2)poss[b][1]|=1u<<s;
 }
 long long states=0,routes=0,zeros[2]={},candidateTotals[2]={};
 int minCandidates[2]={100,100},maxCandidates[2]={0,0};
 for(int b=0;b<N;b++)for(int q=0;q<N;q++){
   uint32_t common[19][2];bool seen[19]{};int nr[19]{};
   for(int t=0;t<19;t++)for(int j=0;j<2;j++)common[t][j]=(1u<<19)-2;
   for(int m=1;m<64;m++){
     int t=sum[b][m],after[6],k=0;
     for(int i=0;i<6;i++)after[i]=(m>>i&1)?d[q][k++]:d[b][i];
     int code=0,p=1;
     for(int i=0;i<6;i++){code+=(after[i]-1)*p;p*=3;}
     seen[t]=true;nr[t]++;
     for(int j=0;j<2;j++)common[t][j]&=poss[code][j];
   }
   for(int t=1;t<19;t++)if(seen[t]){
     states++;routes+=nr[t];
     for(int j=0;j<2;j++){
       int c=__builtin_popcount(common[t][j]);
       zeros[j]+=(c==0);candidateTotals[j]+=c;
       minCandidates[j]=min(minCandidates[j],c);
       maxCandidates[j]=max(maxCandidates[j],c);
     }
   }
 }
 cout<<"board_queue="<<N*N<<" states="<<states<<" routes="<<routes<<"\n";
 for(int j=0;j<2;j++)
   cout<<(j==0?"FREE":"PAIR")<<" zero="<<zeros[j]
       <<" candidates_total="<<candidateTotals[j]
       <<" min="<<minCandidates[j]<<" max="<<maxCandidates[j]<<"\n";
 bool ok=states==6234408LL && routes==33480783LL
  && zeros[0]==0 && zeros[1]==0
  && candidateTotals[0]==69060354LL && candidateTotals[1]==20908809LL
  && minCandidates[0]==4 && maxCandidates[0]==15
  && minCandidates[1]==1 && maxCandidates[1]==5;
 if(!ok){cerr<<"FAIL: exhaustive verification regression\n";return 1;}
 cout<<"PASS: Vol.32 independent exhaustive verification\n";
}

// NUMBER×RUSH Vol.33 — exhaustive FREE / PAIR / TRIPLE verifier
// g++ -O3 -std=c++17 -Wall -Wextra tools/verify-vol33.cpp -o /tmp/verify-vol33 && /tmp/verify-vol33
// Six ordinary tiles 1..3; arbitrary immutable 6-tile reserved queue.
// TARGET CLEAR routes included even if they do not meet current MISSION.
#include <bits/stdc++.h>
using namespace std;
int main() {
  constexpr int N=729;
  int digits[N][6], sums[N][64], count[64];
  uint32_t possible[N][3]{};
  for(int x=0;x<N;x++){int z=x;for(int i=0;i<6;i++){digits[x][i]=z%3+1;z/=3;}}
  for(int mask=1;mask<64;mask++) count[mask]=__builtin_popcount((unsigned)mask);
  for(int b=0;b<N;b++)for(int mask=1;mask<64;mask++){
    int s=0;for(int i=0;i<6;i++)if(mask>>i&1)s+=digits[b][i];
    sums[b][mask]=s;
    possible[b][0]|=1u<<s;
    if(count[mask]==2)possible[b][1]|=1u<<s;
    if(count[mask]==3)possible[b][2]|=1u<<s;
  }
  long long states=0,routes=0,currentStates[3]{},zeros[3]{},totals[3]{};
  int lo[3]={99,99,99},hi[3]{};
  for(int b=0;b<N;b++)for(int q=0;q<N;q++){
    uint32_t common[19][3];
    bool seen[19]{};
    for(int t=0;t<19;t++)for(int j=0;j<3;j++)common[t][j]=(1u<<19)-2;
    for(int mask=1;mask<64;mask++){
      int t=sums[b][mask],after[6],k=0;
      for(int i=0;i<6;i++)after[i]=(mask>>i&1)?digits[q][k++]:digits[b][i];
      int code=0,p=1;
      for(int i=0;i<6;i++){code+=(after[i]-1)*p;p*=3;}
      seen[t]=true;routes++;
      for(int j=0;j<3;j++)common[t][j]&=possible[code][j];
    }
    for(int t=1;t<19;t++)if(seen[t]){
      states++;
      for(int j=0;j<3;j++){
        if(possible[b][j]&(1u<<t))currentStates[j]++;
        int n=__builtin_popcount(common[t][j]);
        zeros[j]+=(n==0);totals[j]+=n;
        lo[j]=min(lo[j],n);hi[j]=max(hi[j],n);
      }
    }
  }
  cout<<"states="<<states<<" routes="<<routes<<"\n";
  const char* name[3]={"FREE","PAIR","TRIPLE"};
  for(int j=0;j<3;j++)
    cout<<name[j]<<" current="<<currentStates[j]<<" zero="<<zeros[j]
        <<" total_candidates="<<totals[j]<<" min="<<lo[j]<<" max="<<hi[j]<<"\n";
  bool ok=states==6234408LL && routes==33480783LL
    && currentStates[0]==6234408LL && currentStates[1]==2088585LL && currentStates[2]==2307285LL
    && zeros[0]==0 && zeros[1]==0 && zeros[2]==17820LL
    && totals[0]==69060354LL && totals[1]==20908809LL && totals[2]==21523251LL
    && lo[0]==4 && hi[0]==15 && lo[1]==1 && hi[1]==5 && lo[2]==0 && hi[2]==6;
  if(!ok){cerr<<"FAIL: Vol.33 exhaustive regression\n";return 1;}
  cout<<"PASS: Vol.33 exhaustive verification\n";
}

# @egomobile/http-server benchmarks

The benchmarks were recorded with [wrk](https://github.com/wg/wrk) by executing the following command:

```bash
wrk -t8 -c100 -d30s http://localhost:3000/user/123
```

## Results

### Node v18.15.0

Machine:

- MacBook Pro (16", 2021)
- CPU: Apple M1 Max
- Memory: 64 GB
- OS: MacOS 13.2.1

Comparison:

| &nbsp;                   | `Express` | `fastify` (with [Express layer](https://github.com/fastify/fastify-express)) | `polka` | `@egomobile/http-server` |
| ------------------------ | :-------: | :--------------------------------------------------------------------------: | :-----: | :----------------------: |
| `Express`                |     -     |                                     96%                                      |   36%   |           34%            |
| `fastify`                |   104%    |                                      -                                       |   37%   |           36%            |
| `polka`                  |   280%    |                                     270%                                     |    -    |           96%            |
| `@egomobile/http-server` |   292%    |                                     281%                                     |  104%   |            -             |

Details:

#### [Express](https://expressjs.com/)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     3.89ms  675.00us  24.36ms   91.14%
    Req/Sec     3.10k   177.85     4.24k    80.75%
  740877 requests in 30.04s, 108.81MB read
Requests/sec:  24665.64
Transfer/sec:      3.62MB
```

#### [fastify](https://github.com/fastify/fastify) (with [Express layer](https://github.com/fastify/fastify-express))

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     3.70ms  763.78us  25.11ms   83.66%
    Req/Sec     3.26k   150.79     5.17k    93.46%
  779213 requests in 30.03s, 128.56MB read
Requests/sec:  25943.80
Transfer/sec:      4.28MB
```

#### [Polka](https://github.com/lukeed/polka)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     1.37ms  330.93us  22.11ms   97.94%
    Req/Sec     8.82k   369.02     9.19k    94.39%
  2113170 requests in 30.10s, 264.00MB read
Requests/sec:  70202.18
Transfer/sec:      8.77MB
```

#### [@egomobile/http-server](https://github.com/egomobile/node-http-server)

```
Running 30s test @ http://localhost:3000/user/123
  8 threads and 100 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency     1.31ms  298.42us  19.89ms   96.60%
    Req/Sec     9.21k   438.38    11.05k    90.94%
  2206870 requests in 30.10s, 275.71MB read
Requests/sec:  73315.03
Transfer/sec:      9.16MB
```
